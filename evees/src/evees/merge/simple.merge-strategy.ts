import { UpdateRequest } from '../interfaces/types';
import { CreateCommit, Evees } from '../evees.service';
import findMostRecentCommonAncestor from './common-ancestor';
import { Merge } from './merge.behaviour';
import { mergeResult } from './utils';
import { Client } from '../interfaces/client';

export class SimpleMergeStrategy {
  static async mergePerspectivesExternal(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    evees: Evees,
    config: any
  ): Promise<string> {
    return SimpleMergeStrategy.mergePerspectives(toPerspectiveId, fromPerspectiveId, config, evees);
  }

  static async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    evees: Evees,
    config: any
  ): Promise<string> {
    const promises = [toPerspectiveId, fromPerspectiveId].map(
      async (id) => (await evees.client.getPerspective(id)).details.headId
    );
    const [toHeadId, fromHeadId] = await Promise.all(promises);

    const remote = await evees.getPerspectiveRemote(toPerspectiveId);

    let newHead: string | undefined;

    newHead = fromHeadId
      ? await SimpleMergeStrategy.mergeCommits(toHeadId, fromHeadId, evees, remote.id, config)
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

    evees.client.update({ updates: [request] });
    return toPerspectiveId;
  }

  static async findLatestNonFork(commitId: string, client: Client) {
    const commit = await client.store.getEntity(commitId);
    if (commit === undefined) throw new Error('commit not found');

    if (commit.object.payload.forking !== undefined) {
      return this.findLatestNonFork(commit.object.payload.forking, client);
    } else {
      return commitId;
    }
  }

  static async mergeCommits(
    toCommitIdOrg: string | undefined,
    fromCommitIdOrg: string,
    evees: Evees,
    remote: string,
    config: any
  ): Promise<string> {
    const toCommitId = toCommitIdOrg
      ? await this.findLatestNonFork(toCommitIdOrg, evees.client)
      : undefined;
    const fromCommitId = await this.findLatestNonFork(fromCommitIdOrg, evees.client);

    const commitsIds = [toCommitId, fromCommitId];
    const ancestorId = toCommitId
      ? await findMostRecentCommonAncestor(evees.client)(commitsIds)
      : fromCommitId;

    const datasPromises = commitsIds.map(async (commitId) => evees.getCommitData(commitId));
    const newDatas = await Promise.all(datasPromises);

    const ancestorData: any =
      ancestorId !== undefined ? await evees.getCommitData(ancestorId) : newDatas[0];

    const mergedData = await SimpleMergeStrategy.mergeData(ancestorData, newDatas, evees, config);

    const dataHash = await evees.client.store.hashEntity(mergedData, remote);
    /** prevent an update head to the same data */
    if (
      ((!!newDatas[0] && dataHash === newDatas[0].id) || toCommitId === fromCommitId) &&
      toCommitIdOrg !== undefined
    ) {
      return toCommitIdOrg;
    }

    evees.client.store.storeEntity(mergedData, remote);

    /** some commits might be undefined */
    const parentsIds = commitsIds.filter((commit) => !!commit);

    const newCommit: CreateCommit = {
      dataId: dataHash,
      parentsIds: parentsIds,
      message: `Merging commits ${parentsIds.toString()}`,
    };

    const securedCommit = await evees.createCommit(newCommit, remote);
    evees.client.store.storeEntity(securedCommit, remote);

    return securedCommit.id;
  }

  static async mergeData<T extends object>(
    originalData: T,
    newDatas: T[],
    evees: Evees,
    config: any
  ): Promise<T> {
    const merge: Merge | undefined = evees.recognizer
      .recognizeBehaviours(originalData)
      .find((prop) => !!(prop as Merge).merge);

    if (!merge)
      throw new Error(
        `Cannot merge data ${JSON.stringify(
          originalData
        )} that does not implement the Mergeable behaviour`
      );

    return merge.merge(originalData)(newDatas, this, evees, config);
  }

  static async mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    evees: Evees,
    config: any
  ): Promise<string[]> {
    const allLinks: Map<string, boolean> = new Map();

    const originalLinksDic = {};
    for (let i = 0; i < originalLinks.length; i++) {
      const link = originalLinks[i];
      originalLinksDic[link] = {
        index: i,
        link: link,
      };
    }

    const newLinks: Array<Map<string, { index: number; link: string }>> = [];
    for (let i = 0; i < modificationsLinks.length; i++) {
      const newData = modificationsLinks[i];
      const links: Map<string, { index: number; link: string }> = new Map();
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
