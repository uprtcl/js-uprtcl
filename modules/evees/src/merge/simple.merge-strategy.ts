import { ApolloClient, gql } from 'apollo-boost';
import { inject, injectable } from 'inversify';

import { DiscoveryModule, EntityCache } from '@uprtcl/multiplatform';
import { Dictionary } from '@uprtcl/micro-orchestrator';
import { CortexModule, PatternRecognizer, Entity } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import { UpdateRequest, Commit, RemoteMap } from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';
import { MergeStrategy } from './merge-strategy';
import findMostRecentCommonAncestor from './common-ancestor';
import { Merge } from '../behaviours/merge';
import { mergeResult } from './utils';
import { deriveEntity } from '../utils/cid-hash';
import { deriveSecured } from '../utils/signed';
import { EveesWorkspace } from '../services/evees.workspace';
import { EveesHelpers } from '../graphql/helpers';

@injectable()
export class SimpleMergeStrategy implements MergeStrategy {
  constructor(
    @inject(EveesBindings.RemoteMap) protected remoteMap: RemoteMap,
    @inject(EveesBindings.Evees) protected evees: Evees,
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>,
    @inject(DiscoveryModule.bindings.EntityCache) protected entityCache: EntityCache
  ) {}

  mergePerspectivesExternal(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    workspace: EveesWorkspace,
    config: any
  ): Promise<string> {
    return this.mergePerspectives(toPerspectiveId, fromPerspectiveId, config, workspace);
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    workspace: EveesWorkspace,
    config: any
  ): Promise<string> {
    const promises = [toPerspectiveId, fromPerspectiveId].map(async (id) =>
      EveesHelpers.getPerspectiveHeadId(this.client, id)
    );
    const [toHeadId, fromHeadId] = await Promise.all(promises);

    const remote = await this.evees.getPerspectiveProviderById(toPerspectiveId);

    const newHead = await this.mergeCommits(
      toHeadId,
      fromHeadId,
      remote.authority,
      workspace,
      config
    );

    /** prevent an update head to the same head */
    if (newHead === toHeadId) {
      return toPerspectiveId;
    }

    const request: UpdateRequest = {
      fromPerspectiveId,
      perspectiveId: toPerspectiveId,
      oldHeadId: toHeadId,
      newHeadId: newHead,
    };

    workspace.update(request);
    return toPerspectiveId;
  }

  protected async loadPerspectiveData(perspectiveId: string): Promise<Entity<any>> {
    const result = await this.client.query({
      query: gql`{
        entity(ref: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
              data {
                id 
                _context {
                  object
                }
              }
            }
          }
        }
      }`,
    });

    const object = result.data.entity.head.data._context.object;
    return {
      id: result.data.entity.head.data.id,
      object,
    };
  }

  protected async loadCommitData(commitId: string): Promise<Entity<any>> {
    const result = await this.client.query({
      query: gql`{
        entity(ref: "${commitId}") {
          id
          data {
            id
            _context {
              object
            }
          }
        }
      }`,
    });

    const object = result.data.entity.data._context.object;
    return {
      id: result.data.entity.data.id,
      object,
    };
  }

  async mergeCommits(
    toCommitId: string,
    fromCommitId: string,
    authority: string,
    workspace: EveesWorkspace,
    config: any
  ): Promise<string> {
    if (toCommitId === fromCommitId) {
      return toCommitId;
    }

    const commitsIds = [toCommitId, fromCommitId];
    const ancestorId = await findMostRecentCommonAncestor(this.client)(commitsIds);

    const datasPromises = commitsIds.map(async (commitId) => this.loadCommitData(commitId));
    const newDatas = await Promise.all(datasPromises);

    const ancestorData: any =
      ancestorId !== undefined ? await this.loadCommitData(ancestorId) : newDatas[0];

    const mergedData = await this.mergeData(ancestorData, newDatas, workspace, config);

    const type = this.recognizer.recognizeType(ancestorData);
    const remote = this.evees.getAuthority(authority);

    const sourceRemote = this.remoteMap(remote, type);

    const entity = await deriveEntity(mergedData, sourceRemote.cidConfig);
    entity.casID = sourceRemote.casID;

    /** prevent an update head to the same data */
    if (entity.id === newDatas[0].id) {
      return toCommitId;
    }

    workspace.create(entity);

    if (!remote.userId) throw new Error('Cannot create commits in a casID you are not signed in');

    const newCommit: Commit = {
      dataId: entity.id,
      parentsIds: commitsIds,
      message: `Merge commits ${commitsIds.toString()}`,
      timestamp: Date.now(),
      creatorsIds: [remote.userId],
    };

    const securedCommit = await deriveSecured(newCommit, remote.cidConfig);

    securedCommit.casID = remote.casID;
    workspace.create(securedCommit);

    return securedCommit.id;
  }

  async mergeData<T extends object>(
    originalData: T,
    newDatas: T[],
    workspace: EveesWorkspace,
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

    return merge.merge(originalData)(newDatas, this, workspace, config);
  }

  async mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    workspace: EveesWorkspace,
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
