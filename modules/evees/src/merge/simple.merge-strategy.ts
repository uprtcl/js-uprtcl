import { inject, injectable } from 'inversify';

import { Dictionary } from '@uprtcl/micro-orchestrator';
import { CortexModule, PatternRecognizer, Hashed } from '@uprtcl/cortex';
import { KnownSourcesService, DiscoveryModule, DiscoveryService } from '@uprtcl/multiplatform';
import { Secured, createEntity } from '@uprtcl/common';

import { UpdateRequest, Commit, EveesTypes } from '../types';
import { Evees } from '../services/evees';
import { MergeStrategy } from './merge-strategy';
import { isAncestorOf } from '../utils/ancestor';
import findMostRecentCommonAncestor from './common-ancestor';
import { Mergeable } from '../properties/mergeable';
import { mergeResult } from './utils';

@injectable()
export class SimpleMergeStrategy implements MergeStrategy {
  updatesList: UpdateRequest[] = [];

  constructor(
    @inject(EveesTypes.Evees) protected evees: Evees,
    @inject(DiscoveryModule.types.DiscoveryService) protected discovery: DiscoveryService,
    @inject(DiscoveryModule.types.LocalKnownSources) protected knownSources: KnownSourcesService,
    @inject(CortexModule.types.Recognizer) protected recognizer: PatternRecognizer
  ) {}

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string
  ): Promise<UpdateRequest[]> {
    /** initialize list */
    this.updatesList = [];

    const promises = [toPerspectiveId, fromPerspectiveId].map(async id => {
      const details = await this.evees.getPerspectiveDetails(id);
      if (!details.headId)
        throw new Error('Cannot merge a perspective that has no head associated');
      return details.headId;
    });

    const [toHeadId, fromHeadId] = await Promise.all(promises);

    const isAncestor = await isAncestorOf(this.evees)(fromHeadId, toHeadId);
    if (isAncestor) {
      // All commits to merge from are ancestors of the current one, do nothing
      return this.updatesList;
    }

    const mergeCommitId = await this.mergeCommits(toHeadId, fromHeadId);

    this.addUpdateRequest({
      fromPerspectiveId,
      perspectiveId: toPerspectiveId,
      oldHeadId: toHeadId,
      newHeadId: mergeCommitId
    });

    return this.updatesList;
  }

  protected addUpdateRequest(request: UpdateRequest): void {
    this.updatesList.push(request);
  }

  protected async loadPerspectiveData(perspectiveId: string): Promise<Hashed<any>> {
    const details = await this.evees.getPerspectiveDetails(perspectiveId);
    if (!details.headId)
      throw new Error(
        `Error when trying to load data for perspective ${perspectiveId}: perspective has no head associated`
      );

    return this.loadCommitData(details.headId);
  }

  protected async loadCommitData(commitId: string): Promise<Hashed<any>> {
    const commit: Secured<Commit> | undefined = await this.evees.get(commitId);
    if (!commit) throw new Error(`Could not fetch ancestor commit with id ${commitId}`);

    const data = await this.discovery.get(commit.object.payload.dataId);
    if (!data)
      throw new Error(`Could not fetch ancestor data with id ${commit.object.payload.dataId}`);

    return data;
  }

  async mergeCommits(toCommitId: string, fromCommitId: string): Promise<string> {
    const commitsIds = [toCommitId, fromCommitId];

    const ancestorId = await findMostRecentCommonAncestor(this.evees)(commitsIds);
    const ancestorData: any = await this.loadCommitData(ancestorId);

    const datasPromises = commitsIds.map(async commitId => this.loadCommitData(commitId));

    const newDatas: any[] = await Promise.all(datasPromises);

    const newData = await this.mergeData(ancestorData, newDatas);

    const sources = await this.knownSources.getKnownSources(toCommitId);

    const newDataId = await createEntity(this.recognizer)(newData);

    const mergeCommit = await this.evees.createCommit(
      {
        dataId: newDataId,
        parentsIds: commitsIds,
        message: `Merge commits ${commitsIds.toString()}`
      },
      sources ? sources[0] : undefined
    );

    return mergeCommit.id;
  }

  async mergeData<T extends object>(originalData: T, newDatas: T[]): Promise<T> {
    const merge: Mergeable | undefined = this.recognizer
      .recognize(originalData)
      .find(prop => !!(prop as Mergeable));

    if (!merge)
      throw new Error('Cannot merge data that does not implement the Mergeable behaviour');

    return merge.merge(originalData)(newDatas, this);
  }

  async mergeLinks(originalLinks: string[], modificationsLinks: string[][]): Promise<string[]> {
    const allLinks: Dictionary<boolean> = {};

    const originalLinksDic = {};
    for (let i = 0; i < originalLinks.length; i++) {
      const link = originalLinks[i];
      originalLinksDic[link] = {
        index: i,
        link: link
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
          link: link
        };
        allLinks[link] = true;
      }
      newLinks.push(links);
    }

    const resultLinks: any[] = [];
    for (const link of Object.keys(allLinks)) {
      const linkResult = mergeResult(
        originalLinksDic[link],
        newLinks.map(newLink => newLink[link])
      );
      if (linkResult) {
        resultLinks.push(linkResult);
      }
    }

    return resultLinks.sort((link1, link2) => link1.index - link2.index).map(link => link.link);
  }
}
