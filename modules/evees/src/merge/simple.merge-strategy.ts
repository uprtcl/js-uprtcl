import { ApolloClient, gql } from 'apollo-boost';
import { inject, injectable } from 'inversify';

import { DiscoveryModule, EntityCache } from '@uprtcl/multiplatform';
import { Dictionary } from '@uprtcl/micro-orchestrator';
import { CortexModule, PatternRecognizer, Entity } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import {
  UprtclAction,
  UpdateRequest,
  UPDATE_HEAD_ACTION,
  Commit,
  CREATE_COMMIT_ACTION,
  CREATE_DATA_ACTION,
  NodeActions,
  RemoteMap
} from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';
import { MergeStrategy } from './merge-strategy';
import findMostRecentCommonAncestor from './common-ancestor';
import { Merge } from '../behaviours/merge';
import { mergeResult } from './utils';
import { deriveEntity } from '../utils/cid-hash';
import { cacheUpdateRequest } from '../utils/actions';
import { deriveSecured } from 'src/utils/signed';

@injectable()
export class SimpleMergeStrategy implements MergeStrategy {
  constructor(
    @inject(EveesBindings.RemoteMap) protected remoteMap: RemoteMap,
    @inject(EveesBindings.Evees) protected evees: Evees,
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>,
    @inject(DiscoveryModule.bindings.EntityCache) protected entityCache: EntityCache
  ) {}

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config?: any
  ): Promise<NodeActions<string>> {
    const promises = [toPerspectiveId, fromPerspectiveId].map(async id => {
      const result = await this.client.query({
        query: gql`{
          entity(ref: "${id}") {
          id
          ... on Perspective {
            head {
              id
            }
          }
        }}`
      });
      const headId = result.data.entity.head.id;

      if (!headId) throw new Error('Cannot merge a perspective that has no head associated');
      return headId;
    });

    const [toHeadId, fromHeadId] = await Promise.all(promises);

    /*     
    const isAncestor = await isAncestorOf(this.client)(fromHeadId, toHeadId);

    if (isAncestor) {
      // All commits to merge from are ancestors of the current one, do nothing
      return [toPerspectiveId, []];
    }
 */
    const remote = await this.evees.getPerspectiveProviderById(toPerspectiveId);

    const mergeResult = await this.mergeCommits(toHeadId, fromHeadId, remote.authorityID, config);

    const request: UpdateRequest = {
      fromPerspectiveId,
      perspectiveId: toPerspectiveId,
      oldHeadId: toHeadId,
      newHeadId: mergeResult.new
    };
    const action = this.buildUpdateAction(request);

    return {
      new: toPerspectiveId,
      actions: [action, ...mergeResult.actions]
    };
  }

  protected buildUpdateAction(updateRequest: UpdateRequest): UprtclAction {
    const updateHead = {
      type: UPDATE_HEAD_ACTION,
      payload: updateRequest
    };

    cacheUpdateRequest(this.client, updateRequest.perspectiveId, updateRequest.newHeadId);

    return updateHead;
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
      }`
    });

    const object = result.data.entity.head.data._context.object;
    return {
      id: result.data.entity.head.data.id,
      object
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
      }`
    });

    const object = result.data.entity.data._context.object;
    return {
      id: result.data.entity.data.id,
      object
    };
  }

  async mergeCommits(
    toCommitId: string,
    fromCommitId: string,
    authority: string,
    config: any
  ): Promise<NodeActions<string>> {
    const commitsIds = [toCommitId, fromCommitId];

    const ancestorId = await findMostRecentCommonAncestor(this.client)(commitsIds);
    const ancestorData: any = await this.loadCommitData(ancestorId);

    const datasPromises = commitsIds.map(async commitId => this.loadCommitData(commitId));

    const newDatas: any[] = await Promise.all(datasPromises);

    const mergedData = await this.mergeData(
      ancestorData.object,
      newDatas.map(data => data.object),
      config
    );

    const type = this.recognizer.recognizeType(ancestorData);
    const remote = this.evees.getAuthority(authority);

    const sourceRemote = this.remoteMap(remote, type);

    const entity = await deriveEntity(mergedData.new, sourceRemote.cidConfig);

    const newDataAction: UprtclAction = {
      type: CREATE_DATA_ACTION,
      entity: entity,
      payload: {
        casID: sourceRemote.casID
      }
    };
    this.entityCache.cacheEntity(entity);

    if (!remote.userId) throw new Error('Cannot create commits in a casID you are not signed in');

    const newCommit: Commit = {
      dataId: entity.id,
      parentsIds: commitsIds,
      message: `Merge commits ${commitsIds.toString()}`,
      timestamp: Date.now(),
      creatorsIds: [remote.userId]
    };
    const securedCommit = await deriveSecured(newCommit, remote.cidConfig);

    const newCommitAction: UprtclAction = {
      type: CREATE_COMMIT_ACTION,
      entity: securedCommit,
      payload: {
        casID: remote.casID
      }
    };
    this.entityCache.cacheEntity(securedCommit);

    return {
      new: securedCommit.id,
      actions: [newCommitAction, newDataAction, ...mergedData.actions]
    };
  }

  async mergeData<T extends object>(
    originalData: T,
    newDatas: T[],
    config: any
  ): Promise<NodeActions<T>> {
    const merge: Merge | undefined = this.recognizer
      .recognizeBehaviours(originalData)
      .find(prop => !!(prop as Merge).merge);

    if (!merge)
      throw new Error(
        `Cannot merge data ${JSON.stringify(
          originalData
        )} that does not implement the Mergeable behaviour`
      );

    return merge.merge(originalData)(newDatas, this, config);
  }

  async mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    config: any
  ): Promise<NodeActions<string>[]> {
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

    const sortedLinks = resultLinks
      .sort((link1, link2) => link1.index - link2.index)
      .map(link => link.link);

    return sortedLinks.map(
      (link): NodeActions<string> => {
        return { new: link, actions: [] };
      }
    );
  }
}
