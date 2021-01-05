import { EntityCache, loadEntity } from '@uprtcl/multiplatform';
import { Dictionary } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer, Signed } from '@uprtcl/cortex';

import { UpdateRequest, Commit } from '../types';
import { CreateCommit, EveesHelpers } from '../services/evees';
import { MergeStrategy } from './merge-strategy';
import findMostRecentCommonAncestor from './common-ancestor';
import { Merge } from '../behaviours/merge';
import { mergeResult } from './utils';
import { Client } from '../services/client';

export class SimpleMergeStrategy implements MergeStrategy {
  constructor(
    protected recognizer: PatternRecognizer,
    protected client: Client,
    protected entityCache: EntityCache
  ) {}

  mergePerspectivesExternal(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    client: Client,
    config: any
  ): Promise<string> {
    return this.mergePerspectives(toPerspectiveId, fromPerspectiveId, config, client);
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    client: Client,
    config: any
  ): Promise<string> {
    const promises = [toPerspectiveId, fromPerspectiveId].map(
      async (id) => (await client.getPerspective(id)).details.headId
    );
    const [toHeadId, fromHeadId] = await Promise.all(promises);

    const remote = await EveesHelpers.getPerspectiveRemoteById(toPerspectiveId);

    let newHead: string | undefined;

    newHead = fromHeadId
      ? await this.mergeCommits(toHeadId, fromHeadId, remote.id, client, config)
      : toHeadId;

    /** prevent an update head to the same head */
    if (newHead === toHeadId) {
      return toPerspectiveId;
    }

    if (newHead === undefined) {
      throw new Error('New head is undefined');
    }

    const request: UpdateRequest = {
      fromPerspectiveId,
      perspectiveId: toPerspectiveId,
      oldHeadId: toHeadId,
      newHeadId: newHead,
    };

    client.updatePerspectives([request]);
    return toPerspectiveId;
  }

  async findLatestNonFork(commitId: string) {
    const commit = await loadEntity<Signed<Commit>>(this.client, commitId);
    if (commit === undefined) throw new Error('commit not found');

    if (commit.object.payload.forking !== undefined) {
      return this.findLatestNonFork(commit.object.payload.forking);
    } else {
      return commitId;
    }
  }

  async mergeCommits(
    toCommitIdOrg: string | undefined,
    fromCommitIdOrg: string,
    remote: string,
    client: Client,
    config: any
  ): Promise<string> {
    const toCommitId = toCommitIdOrg ? await this.findLatestNonFork(toCommitIdOrg) : undefined;
    const fromCommitId = await this.findLatestNonFork(fromCommitIdOrg);

    const commitsIds = [toCommitId, fromCommitId];
    const ancestorId = toCommitId
      ? await findMostRecentCommonAncestor(this.client)(commitsIds)
      : fromCommitId;

    const datasPromises = commitsIds.map(async (commitId) =>
      EveesHelpers.getCommitData(client, commitId)
    );
    const newDatas = await Promise.all(datasPromises);

    const ancestorData: any =
      ancestorId !== undefined ? await EveesHelpers.getCommitData(client, ancestorId) : newDatas[0];

    const mergedData = await this.mergeData(ancestorData, newDatas, client, config);

    const entity = await client.snapEntity([mergedData]));

    /** prevent an update head to the same data */
    if (
      ((!!newDatas[0] && entity.id === newDatas[0].id) || toCommitId === fromCommitId) &&
      toCommitIdOrg !== undefined
    ) {
      return toCommitIdOrg;
    }

    client.storeEntities([entity]);

    /** some commits might be undefined */
    const parentsIds = commitsIds.filter((commit) => !!commit);

    const newCommit: CreateCommit = {
      dataId: entity.id,
      parentsIds: parentsIds,
      message: `Merging commits ${parentsIds.toString()}`,
    };

    const securedCommit = await EveesHelpers.createCommit(client, newCommit);
    client.storeEntities([securedCommit]);

    return securedCommit.id;
  }

  async mergeData<T extends object>(
    originalData: T,
    newDatas: T[],
    client: Client,
    config: any
  ): Promise<T> {
    const merge: Merge | undefined = this.recognizer
      .recognizeBehaviours(originalData)
      .find((prop) => !!(prop as Merge).merge);

    if (!merge)
      throw new Error(
        `Cannot merge data ${JSON.stringify(
          originalData
        )} that does not implement the Mergeable behaviour`
      );

    return merge.merge(originalData)(newDatas, this, client, config);
  }

  async mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    client: Client,
    config: any
  ): Promise<string[]> {
    const allLinks: Dictionary<boolean> = {};

    const originalLinksDic = {};
    for (let i = 0; i < originalLinks.length; i++) {
      const link = originalLinks[i];
      originalLinksDic[link] = {
        index: i,
        link: link,
      };
    }

    const newLinks: Array<Dictionary<{ index: number; link: string }>> = [];
    for (let i = 0; i < modificationsLinks.length; i++) {
      const newData = modificationsLinks[i];
      const links: Dictionary<{ index: number; link: string }> = {};
      for (let j = 0; j < newData.length; j++) {
        const link = newData[j];
        links[link] = {
          index: j,
          link: link,
        };
        allLinks[link] = true;
      }
      newLinks.push(links);
    }

    const resultLinks: any[] = [];
    for (const link of Object.keys(allLinks)) {
      const linkResult = mergeResult(
        originalLinksDic[link],
        newLinks.map((newLink) => newLink[link])
      );
      if (linkResult) {
        resultLinks.push(linkResult);
      }
    }

    const sortedLinks = resultLinks
      .sort((link1, link2) => link1.index - link2.index)
      .map((link) => link.link);

    return sortedLinks;
  }
}
