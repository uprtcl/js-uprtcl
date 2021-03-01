import { Update } from '../interfaces/types';
import { CreateCommit, Evees } from '../evees.service';

import { Entity } from '../../cas/interfaces/entity';

import findMostRecentCommonAncestor from './common-ancestor';
import { Client } from '../interfaces/client';
import { MergeConfig, MergeStrategy } from './merge-strategy';
import { hashObject } from 'src/cas/utils/cid-hash';

export class SimpleMergeStrategy implements MergeStrategy {
  constructor(protected evees: Evees) {}

  async mergePerspectivesExternal(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: MergeConfig
  ): Promise<string> {
    return this.mergePerspectives(toPerspectiveId, fromPerspectiveId, config);
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: MergeConfig
  ): Promise<string> {
    const promises = [toPerspectiveId, fromPerspectiveId].map(
      async (id) => (await this.evees.client.getPerspective(id)).details.headId
    );
    const [toHeadId, fromHeadId] = await Promise.all(promises);

    const toRemote = await this.evees.getPerspectiveRemote(toPerspectiveId);

    let newHead: string | undefined;

    newHead = fromHeadId
      ? await this.mergeCommits(toHeadId, fromHeadId, toRemote.id, config)
      : toHeadId;

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
      oldDetails: { headId: toHeadId },
      details: { headId: newHead },
    };

    this.evees.client.update({ updates: [request] });
    return toPerspectiveId;
  }

  async findLatestNonFork(commitId: string, client: Client) {
    const commit = await client.store.getEntity(commitId);
    if (commit === undefined) throw new Error('commit not found');

    if (commit.object.payload.forking !== undefined) {
      return this.findLatestNonFork(commit.object.payload.forking, client);
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
      ? await this.findLatestNonFork(toCommitIdOrg, this.evees.client)
      : undefined;
    const fromCommitId = await this.findLatestNonFork(fromCommitIdOrg, this.evees.client);

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
      .store.hashEntity({ object: emptyObject, remote: remote });

    const newDatasDefined = newDatas.map((data) => (data === undefined ? emptyEntity : data));

    const ancestorId = toCommitId
      ? await findMostRecentCommonAncestor(this.evees.client)(commitsIds)
      : undefined;

    const ancestorData = ancestorId ? await this.evees.getCommitData(ancestorId) : emptyEntity;

    const mergedObject = await this.mergeData(ancestorData, newDatasDefined, config);

    const data = await this.evees.client.store.hashEntity({ object: mergedObject, remote });
    /** prevent an update head to the same data */
    if (
      ((!!newDatas[0] && data.id === newDatas[0].id) || toCommitId === fromCommitId) &&
      toCommitIdOrg !== undefined
    ) {
      return toCommitIdOrg;
    }

    this.evees.client.store.storeEntity({ object: mergedObject, remote });

    /** some commits might be undefined */
    const parentsIds = commitsIds.filter((commit) => !!commit);

    const newCommit: CreateCommit = {
      dataId: data.id,
      parentsIds: parentsIds,
      message: `Merging commits ${parentsIds.toString()}`,
    };

    const securedCommit = await this.evees.createCommit(newCommit, remote);
    this.evees.client.store.storeEntity({ object: securedCommit, remote });

    return securedCommit.id;
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
