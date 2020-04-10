import { ApolloClient, gql } from 'apollo-boost';
import { inject, injectable } from 'inversify';

import { DiscoveryModule, EntityCache } from '@uprtcl/multiplatform';
import { Dictionary } from '@uprtcl/micro-orchestrator';
import { CortexModule, PatternRecognizer, Entity } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import {
  RemotesConfig,
  UprtclAction,
  UpdateRequest,
  UPDATE_HEAD_ACTION,
  Commit,
  CREATE_COMMIT_ACTION,
  CREATE_DATA_ACTION
} from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';
import { MergeStrategy } from './merge-strategy';
import findMostRecentCommonAncestor from './common-ancestor';
import { Mergeable } from '../properties/mergeable';
import { mergeResult } from './utils';
import { hashObject, signAndHashObject } from '../patterns/cid-hash';
import { cacheUpdateRequest } from '../utils/actions';

@injectable()
export class SimpleMergeStrategy implements MergeStrategy {
  constructor(
    @inject(EveesBindings.RemotesConfig) protected remotesConfig: RemotesConfig,
    @inject(EveesBindings.Evees) protected evees: Evees,
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>,
    @inject(DiscoveryModule.bindings.EntityCache) protected entityCache: EntityCache
  ) {}

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config?: any
  ): Promise<[string, UprtclAction[]]> {
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

    const [mergeCommitId, actions] = await this.mergeCommits(
      toHeadId,
      fromHeadId,
      remote.authorityID,
      config
    );

    const request: UpdateRequest = {
      fromPerspectiveId,
      perspectiveId: toPerspectiveId,
      oldHeadId: toHeadId,
      newHeadId: mergeCommitId
    };
    const action = this.buildUpdateAction(request);

    return [toPerspectiveId, [action, ...actions]];
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
      entity: object
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
      entity: object
    };
  }

  async mergeCommits(
    toCommitId: string,
    fromCommitId: string,
    authority: string,
    config: any
  ): Promise<[string, UprtclAction[]]> {
    const commitsIds = [toCommitId, fromCommitId];

    const ancestorId = await findMostRecentCommonAncestor(this.client)(commitsIds);
    const ancestorData: any = await this.loadCommitData(ancestorId);

    const datasPromises = commitsIds.map(async commitId => this.loadCommitData(commitId));

    const newDatas: any[] = await Promise.all(datasPromises);

    const [newData, actions] = await this.mergeData(ancestorData.object, newDatas.map(data => data.object), config);

    // TODO: fix inconsistency
    const sourceRemote = this.remotesConfig.map(authority);

    const hash = await hashObject(newData, sourceRemote.cidConfig);

    const entity: Entity<any> = {
      id: hash,
      entity: newData
    };

    const newDataAction: UprtclAction = {
      type: CREATE_DATA_ACTION,
      entity: entity,
      payload: {
        source: sourceRemote.casID
      }
    };
    this.entityCache.cacheEntity(entity);

    const remote = this.evees.getAuthority(authority);

    if (!remote.userId) throw new Error('Cannot create commits in a source you are not signed in');

    const newCommit: Commit = {
      dataId: entity.id,
      parentsIds: commitsIds,
      message: `Merge commits ${commitsIds.toString()}`,
      timestamp: Date.now(),
      creatorsIds: [remote.userId]
    };
    const securedCommit = await signAndHashObject(newCommit, remote.cidConfig);

    const newCommitAction: UprtclAction = {
      type: CREATE_COMMIT_ACTION,
      entity: securedCommit,
      payload: {
        source: remote.casID
      }
    };
    this.entityCache.cacheEntity(securedCommit);

    return [securedCommit.id, [newCommitAction, newDataAction, ...actions]];
  }

  async mergeData<T extends object>(
    originalData: T,
    newDatas: T[],
    config: any
  ): Promise<[T, UprtclAction[]]> {
    const merge: Mergeable | undefined = this.recognizer
      .recognizeBehaviours(originalData)
      .find(prop => !!(prop as Mergeable).merge);

    if (!merge)
      throw new Error(`Cannot merge data ${JSON.stringify(originalData)} that does not implement the Mergeable behaviour`);

    return merge.merge(originalData)(newDatas, this, config);
  }

  async mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    config
  ): Promise<[string[], UprtclAction[]]> {
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

    return [
      resultLinks.sort((link1, link2) => link1.index - link2.index).map(link => link.link),
      []
    ];
  }
}
