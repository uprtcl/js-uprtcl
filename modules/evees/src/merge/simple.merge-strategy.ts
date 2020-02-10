import { ApolloClient } from 'apollo-boost';
import { inject, injectable } from 'inversify';

import { Dictionary } from '@uprtcl/micro-orchestrator';
import { CortexModule, PatternRecognizer, Hashed } from '@uprtcl/cortex';
import { KnownSourcesService, DiscoveryModule, DiscoveryService } from '@uprtcl/multiplatform';
import { createEntity } from '@uprtcl/multiplatform';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Secured } from '../patterns/default-secured.pattern';
import { UpdateRequest, Commit, RemotesConfig, UprtclAction, UPDATE_HEAD_ACTION } from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';
import { MergeStrategy } from './merge-strategy';
import { isAncestorOf } from '../utils/ancestor';
import findMostRecentCommonAncestor from './common-ancestor';
import { Mergeable } from '../properties/mergeable';
import { mergeResult } from './utils';
import { CREATE_COMMIT } from '../graphql/queries';

@injectable()
export class SimpleMergeStrategy implements MergeStrategy {
  updatesList: UprtclAction[] = [];

  constructor(
    @inject(EveesBindings.RemotesConfig) protected remotesConfig: RemotesConfig,
    @inject(EveesBindings.Evees) protected evees: Evees,
    @inject(DiscoveryModule.bindings.DiscoveryService) protected discovery: DiscoveryService,
    @inject(DiscoveryModule.bindings.LocalKnownSources) protected knownSources: KnownSourcesService,
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>
  ) {}

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config?: any
  ): Promise<UprtclAction[]> {
    /** initialize list */
    this.updatesList = [];

    const promises = [toPerspectiveId, fromPerspectiveId].map(async id => {
      const remote = await this.evees.getPerspectiveProviderById(id);
      const details = await remote.getPerspectiveDetails(id);

      if (!details.headId)
        throw new Error('Cannot merge a perspective that has no head associated');
      return details.headId;
    });

    const [toHeadId, fromHeadId] = await Promise.all(promises);

    const isAncestor = await isAncestorOf(this.discovery)(fromHeadId, toHeadId);
    if (isAncestor) {
      // All commits to merge from are ancestors of the current one, do nothing
      return this.updatesList;
    }

    const remote = await this.evees.getPerspectiveProviderById(toPerspectiveId);
    
    const mergeCommitId = await this.mergeCommits(toHeadId, fromHeadId, remote.authority, remote.source, config);

    this.addUpdateRequest({
      fromPerspectiveId,
      perspectiveId: toPerspectiveId,
      oldHeadId: toHeadId,
      newHeadId: mergeCommitId
    });

    return this.updatesList;
  }

  protected addUpdateRequest(request: UpdateRequest): void {
    const updateHeadAction: UprtclAction = {
      type: UPDATE_HEAD_ACTION,
      payload: request      
    }
    this.updatesList.push(updateHeadAction);
  }

  protected async loadPerspectiveData(perspectiveId: string): Promise<Hashed<any>> {
    const remote = await this.evees.getPerspectiveProviderById(perspectiveId);
    const details = await remote.getPerspectiveDetails(perspectiveId);
    if (!details.headId)
      throw new Error(
        `Error when trying to load data for perspective ${perspectiveId}: perspective has no head associated`
      );

    return this.loadCommitData(details.headId);
  }

  protected async loadCommitData(commitId: string): Promise<Hashed<any>> {
    const commit: Secured<Commit> | undefined = await this.discovery.get(commitId);
    if (!commit) throw new Error(`Could not fetch ancestor commit with id ${commitId}`);

    const data = await this.discovery.get(commit.object.payload.dataId);
    if (!data)
      throw new Error(`Could not fetch ancestor data with id ${commit.object.payload.dataId}`);

    return data;
  }

  async mergeCommits(toCommitId: string, fromCommitId: string, authority: string, source: string, config: any): Promise<string> {
    const commitsIds = [toCommitId, fromCommitId];

    const ancestorId = await findMostRecentCommonAncestor(this.discovery)(commitsIds);
    const ancestorData: any = await this.loadCommitData(ancestorId);

    const datasPromises = commitsIds.map(async commitId => this.loadCommitData(commitId));

    const newDatas: any[] = await Promise.all(datasPromises);

    const newData = await this.mergeData(ancestorData, newDatas, config);
    
    const patternName = this.recognizer.recognize(newData)[0].name;
    const newDataId = await createEntity(this.recognizer)(newData, this.remotesConfig.map(authority, patternName).source);

    const mergeCommit = await this.client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        dataId: newDataId,
        parentsIds: commitsIds,
        message: `Merge commits ${commitsIds.toString()}`,
        source: source
      }
    });

    return mergeCommit.data.createCommit.id;
  }

  async mergeData<T extends object>(originalData: T, newDatas: T[], config: any): Promise<T> {
    const merge: Mergeable | undefined = this.recognizer
      .recognize(originalData)
      .find(prop => !!(prop as Mergeable).merge);

    if (!merge)
      throw new Error('Cannot merge data that does not implement the Mergeable behaviour');

    return merge.merge(originalData)(newDatas, this, config);
  }

  async mergeLinks(originalLinks: string[], modificationsLinks: string[][], config): Promise<string[]> {
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
