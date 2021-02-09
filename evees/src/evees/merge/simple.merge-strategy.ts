import { Update } from '../interfaces/types';
import { CreateCommit, Evees } from '../evees.service';

import { Entity } from '../../cas/interfaces/entity';

import findMostRecentCommonAncestor from './common-ancestor';
import { mergeResult } from './utils';
import { Client } from '../interfaces/client';
import { MergeStrategy } from './merge-strategy';

export class SimpleMergeStrategy implements MergeStrategy {
  constructor(protected evees: Evees) {}

  async mergePerspectivesExternal(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: any
  ): Promise<string> {
    return this.mergePerspectives(toPerspectiveId, fromPerspectiveId, config);
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: any
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
    config: any
  ): Promise<string> {
    const toCommitId = toCommitIdOrg
      ? await this.findLatestNonFork(toCommitIdOrg, this.evees.client)
      : undefined;
    const fromCommitId = await this.findLatestNonFork(fromCommitIdOrg, this.evees.client);

    const commitsIds = [toCommitId, fromCommitId];
    const ancestorId = toCommitId
      ? await findMostRecentCommonAncestor(this.evees.client)(commitsIds)
      : fromCommitId;

    const datasPromises = commitsIds.map(async (commitId) => this.evees.getCommitData(commitId));
    const newDatas = await Promise.all(datasPromises);

    const ancestorData: any =
      ancestorId !== undefined ? await this.evees.getCommitData(ancestorId) : newDatas[0];

    const mergedData = await this.mergeData(ancestorData, newDatas, config);

    const dataHash = await this.evees.client.store.hashEntity({ object: mergedData, remote });
    /** prevent an update head to the same data */
    if (
      ((!!newDatas[0] && dataHash === newDatas[0].id) || toCommitId === fromCommitId) &&
      toCommitIdOrg !== undefined
    ) {
      return toCommitIdOrg;
    }

    this.evees.client.store.storeEntity({ object: mergedData, remote });

    /** some commits might be undefined */
    const parentsIds = commitsIds.filter((commit) => !!commit);

    const newCommit: CreateCommit = {
      dataId: dataHash,
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
    config: any
  ): Promise<T> {
    const merge = this.evees.behavior(originalData.object, 'merge');

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

  async mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
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
