import { gql, ApolloClient } from 'apollo-boost';
import { injectable, inject } from 'inversify';

import { Dictionary } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EntityCache, DiscoveryModule, loadEntity } from '@uprtcl/multiplatform';
import { HasChildren, CortexModule, Entity, PatternRecognizer } from '@uprtcl/cortex';

import { SimpleMergeStrategy } from './simple.merge-strategy';
import {
  Commit,
  UprtclAction,
  CREATE_COMMIT_ACTION,
  CREATE_DATA_ACTION,
  UpdateRequest,
  RemoteMap,
  NodeActions
} from '../types';
import { deriveEntity } from '../utils/cid-hash';
import { EveesBindings } from '../bindings';
import { Evees, deriveSecured } from '../uprtcl-evees';

@injectable()
export class RecursiveContextMergeStrategy extends SimpleMergeStrategy {
  perspectivesByContext!: Dictionary<{
    to: string | undefined;
    from: string | undefined;
  }>;

  allPerspectives!: Dictionary<string>;

  async isPattern(id: string, type: string): Promise<boolean> {
    const entity = (await loadEntity(this.client, id)) as object;
    const recongnizedType = this.recognizer.recognizeType(entity);
    return type === recongnizedType;
  }

  setPerspective(perspectiveId: string, context: string, to: boolean): void {
    if (!this.perspectivesByContext[context]) {
      this.perspectivesByContext[context] = {
        to: undefined,
        from: undefined
      };
    }

    if (to) {
      this.perspectivesByContext[context].to = perspectiveId;
    } else {
      this.perspectivesByContext[context].from = perspectiveId;
    }

    this.allPerspectives[perspectiveId] = context;
  }

  async readPerspective(perspectiveId: string, to: boolean): Promise<void> {
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

            context {
              id
            }
          }
        }
      }`
    });

    const context = result.data.entity.context.id;

    if (result.data.entity.head == null) {
      throw new Error(`head null reading perspective ${perspectiveId}`);
    }

    const dataObject = result.data.entity.head.data._context.object;
    const dataId = result.data.entity.head.data.id;
    const data = { id: dataId, entity: dataObject };

    this.setPerspective(perspectiveId, context, to);

    const hasChildren: HasChildren | undefined = this.recognizer
      .recognizeBehaviours(data)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (hasChildren) {
      const links = hasChildren.getChildrenLinks(dataObject);

      const promises = links.map(async link => {
        const isPerspective = await this.isPattern(link, 'Perspective');
        if (isPerspective) {
          this.readPerspective(link, to);
        } else {
          Promise.resolve();
        }
      });

      await Promise.all(promises);
    }
  }

  async readAllSubcontexts(toPerspectiveId: string, fromPerspectiveId: string): Promise<void> {
    const promises = [
      this.readPerspective(toPerspectiveId, true),
      this.readPerspective(fromPerspectiveId, false)
    ];

    await Promise.all(promises);
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: any
  ): Promise<NodeActions<string>> {
    let root = false;
    if (!this.perspectivesByContext) {
      root = true;
      this.perspectivesByContext = {};
      this.allPerspectives = {};
      await this.readAllSubcontexts(toPerspectiveId, fromPerspectiveId);
    }

    return super.mergePerspectives(toPerspectiveId, fromPerspectiveId, config);
  }

  private async getPerspectiveContext(perspectiveId: string): Promise<string> {
    if (this.allPerspectives[perspectiveId]) {
      return this.allPerspectives[perspectiveId];
    } else {
      const result = await this.client.query({
        query: gql`{
          entity(ref: "${perspectiveId}") {
            id
            ... on Perspective {
              context{
                id
              }
            }
          }
        }`
      });

      const context = result.data.entity.context.id;

      if (!context)
        throw new Error(
          `Cannot merge based on context: context of perspective with id ${perspectiveId} is undefined`
        );

      return context;
    }
  }

  async getLinkMergeId(link: string) {
    const isPerspective = await this.isPattern(link, 'Perspective');
    if (isPerspective) {
      return this.getPerspectiveContext(link);
    } else {
      return Promise.resolve(link);
    }
  }

  async checkPerspectiveAndOwner(perspectiveId: string, authority: string, canWrite: string) {
    const result = await this.client.query({
      query: gql`{
        entity(ref: "${perspectiveId}") {
          id
          ... on Perspective { payload { authority} }
          _context { patterns { accessControl { permissions} } }
        }
      }`
    });

    const thisAuthority = result.data.entity.payload.authority;
    const owner = result.data.entity._context.patterns.accessControl.permissions.owner;

    if (authority !== thisAuthority) {
      return false;
    } else {
      return canWrite === owner;
    }
  }

  async mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    config: any
  ): Promise<NodeActions<string>[]> {
    /** The context is used as Merge ID for perspective to have a context-based merge. For othe
     * type of entities, like commits or data, the link itself is used is mergeId */
    const originalPromises = originalLinks.map(link => this.getLinkMergeId(link));
    const modificationsPromises = modificationsLinks.map(links =>
      links.map(link => this.getLinkMergeId(link))
    );

    const originalMergeIds = await Promise.all(originalPromises);
    const modificationsMergeIds = await Promise.all(
      modificationsPromises.map(promises => Promise.all(promises))
    );

    const mergedLinks = await super.mergeLinks(originalMergeIds, modificationsMergeIds, config);

    const dictionary = this.perspectivesByContext;

    const mergeLinks = mergedLinks.map(
      async (mergeResult): Promise<NodeActions<string>> => {
        const perspectivesByContext = dictionary[mergeResult.new];

        if (perspectivesByContext) {
          const needsSubperspectiveMerge = perspectivesByContext.to && perspectivesByContext.from;

          if (needsSubperspectiveMerge) {
            /** Two perspectives of the same context are merged, keeping the "to" perspecive id,
             *  and updating its head */

            const { actions } = await this.mergePerspectives(
              perspectivesByContext.to as string,
              perspectivesByContext.from as string,
              config
            );

            return {
              new: perspectivesByContext.to as string,
              actions: actions.concat(...mergeResult.actions)
            };
          } else {
            if (perspectivesByContext.to) {
              /** if the perspective is only present in the "to", just keep it */
              return {
                new: perspectivesByContext.to,
                actions: []
              };
            } else {
              /** otherwise, if merge config.forceOwner and this perspective is only present in the
               * "from", a fork may be created to make sure the final perspective is in the target authority
               * and canWrite (TODO: canWrite will be replaced by a "copy permissions from element"  or
               * something */

              if (config.forceOwner) {
                const isInternal = await this.checkPerspectiveAndOwner(
                  perspectivesByContext.from as string,
                  config.authority,
                  config.canWrite
                );

                if (!isInternal) {
                  const newPerspectiveActions = await this.evees.forkPerspective(
                    perspectivesByContext.from as string,
                    config.authority,
                    config.canWrite
                  );

                  return newPerspectiveActions;
                } else {
                  return {
                    new: perspectivesByContext.from as string,
                    actions: []
                  };
                }
              } else {
                return {
                  new: perspectivesByContext.from as string,
                  actions: []
                };
              }
            }
          }
        }
        return {
          new: mergeResult.new,
          actions: []
        };
      }
    );

    const mergeResults = await Promise.all(mergeLinks);

    return mergeResults;
  }

  protected async updatePerspectiveData(
    perspectiveId: string,
    data: any
  ): Promise<Array<UprtclAction>> {
    const result = await this.client.query({
      query: gql`{
        entity(ref: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
              data {
                id
              }
            }
            payload {
              authority
            }
          }
        }
      }`
    });

    const authority = result.data.entity.payload.authority;
    const headId = result.data.entity.head.id;
    const type = this.recognizer.recognizeType(data);

    const remote = this.evees.getAuthority(authority);

    if (!remote.userId)
      throw new Error('Cannot create perspectives in a remote you are not signed in');

    const dataSource = this.remoteMap(remote, type);

    const entity = await deriveEntity(data, dataSource.cidConfig);

    const newDataAction: UprtclAction = {
      type: CREATE_DATA_ACTION,
      entity,
      payload: {
        casID: dataSource.casID
      }
    };

    this.entityCache.cacheEntity(entity);

    const commit: Commit = {
      dataId: entity.id,
      parentsIds: headId ? [headId] : [],
      creatorsIds: [remote.userId],
      message: 'Merge: reference new commits',
      timestamp: Date.now()
    };

    const securedCommit = await deriveSecured(commit, remote.cidConfig);

    const newCommitAction: UprtclAction = {
      type: CREATE_COMMIT_ACTION,
      entity: securedCommit,
      payload: {
        casID: remote.casID
      }
    };

    this.entityCache.cacheEntity(securedCommit);

    const updateRequest: UpdateRequest = {
      fromPerspectiveId: undefined,
      perspectiveId,
      oldHeadId: headId,
      newHeadId: securedCommit.id
    };

    const updateHead = this.buildUpdateAction(updateRequest);

    return [updateHead, newCommitAction, newDataAction];
  }
}
