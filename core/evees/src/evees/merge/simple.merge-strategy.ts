import { Logger } from '../../utils';

import { Update } from '../interfaces/types';
import { CreateCommit, Evees } from '../evees.service';

import findMostRecentCommonAncestor from './common-ancestor';
import { MergeConfig, MergeStrategy } from './merge-strategy';
import { Entity } from '../interfaces/entity';
import { EntityResolver } from '../interfaces/entity.resolver';

const LOGINFO = false;

export class SimpleMergeStrategy implements MergeStrategy {
  logger = new Logger('MergeStrategy');

  constructor(protected evees: Evees) {}

  async mergePerspectivesExternal(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: MergeConfig
  ): Promise<string> {
    if (LOGINFO)
      this.logger.log('mergePerspectivesExternal()', {
        toPerspectiveId,
        fromPerspectiveId,
        config,
      });
    return this.mergePerspectives(toPerspectiveId, fromPerspectiveId, config);
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: MergeConfig
  ): Promise<string> {
    if (LOGINFO)
      this.logger.log('mergePerspectives()', { toPerspectiveId, fromPerspectiveId, config });

    if (toPerspectiveId === fromPerspectiveId) {
      return toPerspectiveId;
    }

    const promises = [toPerspectiveId, fromPerspectiveId].map(
      async (id) => (await this.evees.getPerspective(id)).details.headId
    );
    const [toHeadId, fromHeadId] = await Promise.all(promises);

    const toRemote = await this.evees.getPerspectiveRemote(toPerspectiveId);

    let newHead: string | undefined;

    if (LOGINFO) this.logger.log('mergeCommits() - pre', { toHeadId, fromHeadId, config });
    newHead = fromHeadId
      ? await this.mergeCommits(toHeadId, fromHeadId, toRemote.id, config)
      : toHeadId;

    if (LOGINFO)
      this.logger.log('mergeCommits() - post', { newHead, toHeadId, fromHeadId, config });

    /** prevent an update head to the same head */
    if (newHead === toHeadId) {
      return toPerspectiveId;
    }

    if (newHead === undefined) {
      throw new Error('New head is undefined');
    }

    const request: Update = {
      fromPerspectiveId,
      perspectiveId: toPerspectiveId,
      details: { headId: newHead },
      indexData: {
        onEcosystem: config.addOnEcosystem ? config.addOnEcosystem : [],
      },
    };

    if (LOGINFO) this.logger.log('updatePerspective()', { request });
    await this.evees.updatePerspective(request);

    return toPerspectiveId;
  }

  async findLatestNonFork(commitId: string, entityResolver: EntityResolver) {
    const commit = await entityResolver.getEntity(commitId);
    if (commit === undefined) throw new Error('commit not found');

    if (commit.object.payload.forking !== undefined) {
      return this.findLatestNonFork(commit.object.payload.forking, entityResolver);
    } else {
      return commitId;
    }
  }

  async mergeCommits(
    toCommitIdOrg: string | undefined,
    fromCommitIdOrg: string,
    remote: string,
    config: MergeConfig
  ): Promise<string> {
    const toCommitId = toCommitIdOrg
      ? await this.findLatestNonFork(toCommitIdOrg, this.evees.entityResolver)
      : undefined;
    const fromCommitId = await this.findLatestNonFork(fromCommitIdOrg, this.evees.entityResolver);

    const commitsIds = [toCommitId, fromCommitId];

    const datasPromises = commitsIds.map(async (commitId) => this.evees.tryGetCommitData(commitId));
    const newDatas = await Promise.all(datasPromises);
    const fromData = newDatas[1];

    if (!fromData) {
      throw new Error('fromData not defined');
    }

    /** merges can be done from defined perspectives to undefined ones. If the "to" perspective
     * head and data are undefined, we need to know the initial data object (usually the correspondent of the "empty" object)
     * to be used as reference for the merge, and assume the ancestorData and the to branch have that data as its current value */
    const emptyObject = this.evees.behaviorFirst(fromData.object, 'empty');
    const emptyEntity = await this.evees
      .getRemote(remote)
      .entityRemote.hashObject({ object: emptyObject, remote: remote });

    const newDatasDefined = newDatas.map((data) => (data === undefined ? emptyEntity : data));

    let ancestorId: string | undefined = undefined;
    if (toCommitId) {
      try {
        await findMostRecentCommonAncestor(this.evees.entityResolver)(commitsIds);
      } catch (e) {
        console.error(`Error in findMostRecentCommonAncestor`, { commitsIds, e });
      }
    }

    // If the ancestor is the fromFommit, then no new changes made and no need to merge
    if (toCommitIdOrg !== undefined && ancestorId === fromCommitId) {
      return toCommitIdOrg;
    }

    const ancestorData = ancestorId ? await this.evees.getCommitData(ancestorId) : emptyEntity;

    if (LOGINFO) this.logger.log('mergeData() - pre', { ancestorData, newDatasDefined, config });
    const mergedObject = await this.mergeData(ancestorData, newDatasDefined, config);
    if (LOGINFO)
      this.logger.log('mergeData() - done', {
        mergedObject,
        ancestorData,
        newDatasDefined,
        config,
      });

    const data = await this.evees.hashObject({ object: mergedObject, remote });
    /** prevent an update head to the same data */
    if (
      ((!!newDatas[0] && data.hash === newDatas[0].hash) || toCommitId === fromCommitId) &&
      toCommitIdOrg !== undefined
    ) {
      return toCommitIdOrg;
    }

    await this.evees.hashObject({ object: mergedObject, remote });

    /** some commits might be undefined */
    const parentsIds = config.detach
      ? toCommitId
        ? [toCommitId]
        : []
      : commitsIds.filter((commit) => !!commit);

    const newCommit: CreateCommit = {
      dataId: data.hash,
      parentsIds: parentsIds,
      message: `Merging commits ${parentsIds.toString()}`,
    };

    const securedCommit = await this.evees.createCommit(newCommit, remote);
    await this.evees.hashObject({ object: securedCommit, remote });

    return securedCommit.hash;
  }

  async mergeData<T extends object>(
    originalData: Entity<T>,
    newDatas: Entity<T>[],
    config: MergeConfig
  ): Promise<T> {
    /** use "ours" latest version of the object as the selector for the merge strategy */
    const merge = this.evees.behaviorFirst(newDatas[0].object, 'merge') as Function;

    if (!merge)
      throw new Error(
        `Cannot merge data ${JSON.stringify(
          originalData.object
        )} that does not implement the Mergeable behaviour`
      );

    return merge(
      newDatas.map((d) => d.object),
      this,
      config
    );
  }
}
