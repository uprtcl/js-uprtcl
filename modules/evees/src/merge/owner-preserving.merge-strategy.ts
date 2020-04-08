import { injectable } from 'inversify';

import { HasChildren, Entity, Signed } from '@uprtcl/cortex';

import {
  UpdateRequest,
  RemotesConfig,
  UprtclAction,
  UPDATE_HEAD_ACTION,
  CREATE_AND_INIT_PERSPECTIVE_ACTION,
  CREATE_COMMIT_ACTION,
  CREATE_DATA_ACTION,
  Commit
} from '../types';
import { RecursiveContextMergeStrategy } from './recursive-context.merge-strategy';
import { gql } from 'apollo-boost';
import { cacheActions } from '../utils/actions';
import { Secured, hashObject } from '../patterns/cid-hash';

export interface OwnerPreservingConfig {
  targetCanWrite: string;
  targetAuthority: string;
}

@injectable()
export class OwnerPreservingMergeStrategy extends RecursiveContextMergeStrategy {
  async getEntity(id: string): Promise<Entity<any>> {
    const result = await this.client.query({
      query: gql`{
        entity(ref: "${id}") {
          id
          _context {
            object
          }
        }
      }`
    });

    const object = result.data.entity._context.object;
    return { id, entity: object };
  }

  async getOwnerPreservingActions(
    updateRequest: UpdateRequest,
    targetAuthority: string,
    targetCanWrite: string
  ): Promise<Array<UprtclAction>> {
    let oldLinks: string[] = [];

    if (updateRequest.oldHeadId) {
      const oldData = await this.loadCommitData(updateRequest.oldHeadId);
      let oldHasChildren: HasChildren | undefined = this.recognizer
        .recognizeBehaviours(oldData)
        .find(prop => !!(prop as HasChildren).getChildrenLinks);

      if (!oldHasChildren) {
        oldLinks = [];
      } else {
        oldLinks = oldHasChildren.getChildrenLinks(oldData);
      }
    }

    let newLinks: string[] = [];

    const newData = await this.loadCommitData(updateRequest.newHeadId);
    let newHasChildren: HasChildren | undefined = this.recognizer
      .recognizeBehaviours(newData)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (!newHasChildren) {
      newLinks = [];
    } else {
      newLinks = newHasChildren.getChildrenLinks(newData);
    }

    /**
     * Check for each newLink that was not an old link if the authority and canWrite are the
     * target, if not, create a global perspective on the targetAuthority where targetCanWrite canWrite
     */

    const newNewLinksPromises = newLinks.map(
      async (newLink): Promise<[string, Array<UprtclAction>]> => {
        if (!oldLinks.includes(newLink)) {
          let fork = false;

          /** TODO: generalize to not-to-perspective links */
          const result = await this.client.query({
            query: gql`{
              entity(ref: "${newLink}") {
                id

                ... on Perspective {
                  payload {
                    origin
                  }
                  head {
                    id
                  }
                  context {
                    id
                  }
                  name
                }

                _context {
                  patterns {
                    accessControl {
                      permissions
                      canWrite
                    }
                  }
                }
              }
            }`
          });
          const authority = result.data.entity.payload.origin;
          const canWrite = result.data.entity._context.patterns.accessControl.canWrite;
          const headId = result.data.entity.head.id;
          const name = result.data.entity.name;
          const context = result.data.entity.context.id;

          if (authority !== targetAuthority) {
            /** if different remote, then fork */
            fork = true;
          } else {
            if (!canWrite) {
              fork = true;
            }
          }

          if (fork) {
            /** create a global perspective of the link and set as the new link */
            const [perspective, actions] = await this.evees.computeNewGlobalPerspectiveOps(
              targetAuthority,
              {
                context,
                headId,
                name: `from${name ? '-' + name : ''}`
              },
              undefined,
              targetCanWrite
            );

            await cacheActions(actions, this.entityCache, this.client);

            /** for each new perspective that is created,
             *  craete a new commit and data
             * (should be a clone but we dont have "clone" mutations and the id
             *  can change when you create the same entity on another remote)  */
            for (let ix = 0; ix < actions.length; ix++) {
              const action = actions[ix];
              if (action.type !== CREATE_AND_INIT_PERSPECTIVE_ACTION) break;

              const headId = action.payload.details.headId;
              const remote = this.evees.getAuthority(targetAuthority);

              const oldHead: Secured<Commit> | undefined = await this.getEntity(headId);
              if (!oldHead) throw new Error(`Error getting the cached head: ${headId}`);

              const oldData = await this.getEntity(oldHead.entity.payload.dataId);

              const newDataId = await hashObject(oldData.entity, remote.cidConfig);

              const newData = {
                id: newDataId,
                entity: oldData.entity
              };
              const newDataAction: UprtclAction = {
                type: CREATE_DATA_ACTION,
                entity: newData,
                payload: {
                  source: remote.casID
                }
              };

              /** build new head object pointing to new data */
              const newHeadObject: Signed<Commit> = {
                payload: {
                  ...oldHead.entity.payload,
                  dataId: newData.id
                },
                proof: {
                  type: '',
                  signature: ''
                }
              };

              const newHeadId = await hashObject(newHeadObject, remote.cidConfig);

              const newCommitAction: UprtclAction = {
                type: CREATE_COMMIT_ACTION,
                entity: {
                  id: newHeadId,
                  entity: newHeadObject
                },
                payload: {
                  source: remote.casID
                }
              };

              /** replace head in headupdate action */
              actions[ix].payload.details.headId = newHeadId;

              /** add the new create commit and head actions */
              actions.push(newCommitAction);
              actions.push(newDataAction);
            }

            return [perspective.id, actions];
          }

          /** if fork false, simple return the same link */
          return [newLink, []];
        } else {
          return [newLink, []];
        }
      }
    );

    const result = await Promise.all(newNewLinksPromises);
    const newNewLinks = result.map(r => r[0]);

    const sameLinks =
      newNewLinks.length === newLinks.length &&
      newNewLinks.every((value, index) => value === newLinks[index]);
    if (!sameLinks) {
      /** create a new data and commit with the new links and update perspective head */
      if (!newHasChildren) throw new Error('Target data dont have children, cant update its links');

      const newNewData = newHasChildren.replaceChildrenLinks(newData)(newNewLinks) as Entity<any>;
      const actions = await this.updatePerspectiveData(
        updateRequest.perspectiveId,
        newNewData.entity
      );

      const globalPerspectiveActions = result.map(r => r[1]);
      return actions.concat(...globalPerspectiveActions);
    } else {
      const action = this.buildUpdateAction(updateRequest);

      return [action];
    }
  }

  depth: number = 0;

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: OwnerPreservingConfig
  ): Promise<[string, UprtclAction[]]> {
    this.depth++;

    const [finalPerspectiveId, mergeActionsOriginal] = await super.mergePerspectives(
      toPerspectiveId,
      fromPerspectiveId,
      config
    );

    this.depth--;

    if (this.depth > 0) return [finalPerspectiveId, mergeActionsOriginal];

    await cacheActions(mergeActionsOriginal, this.entityCache, this.client);

    /** review all updates and craete new global perspective if target authority and
     * canWrite are not as exected. This keeps the target perspective under control of one
     * owner and authority */

    if (!config || !config.targetAuthority || !config.targetCanWrite) {
      throw new Error(
        'config {targetAuthority: string, targetCanWrite: string} should be provided'
      );
    }

    const targetAuthority = config.targetAuthority;
    const targetCanWrite = config.targetCanWrite;

    const updateHeads = mergeActionsOriginal.filter(a => a.type === UPDATE_HEAD_ACTION);
    const getOwnerPreservingPromises = updateHeads.map(updateHead =>
      this.getOwnerPreservingActions(updateHead.payload, targetAuthority, targetCanWrite)
    );

    const ownerPreservingActionsPre = await Promise.all(getOwnerPreservingPromises);
    const ownerPreservingActions = ([] as UprtclAction[]).concat(...ownerPreservingActionsPre);

    /** remove the original headUpdate in mergeActionsOriginal fro which there is a new headUpdate in ownerPreservingActions */
    let mergeActionsNew = [...mergeActionsOriginal];

    ownerPreservingActions
      .filter(a => a.type === UPDATE_HEAD_ACTION)
      .forEach(ownerPreservingAction => {
        const ixHeadUpdate = mergeActionsNew.findIndex(actionOriginal => {
          return (
            actionOriginal.type === UPDATE_HEAD_ACTION &&
            (actionOriginal.payload as UpdateRequest).perspectiveId ===
              (ownerPreservingAction.payload as UpdateRequest).perspectiveId
          );
        });

        /** remove head update */
        mergeActionsNew.splice(ixHeadUpdate, 1)[0];
      });

    const allActions = mergeActionsNew.concat(ownerPreservingActions);

    return [finalPerspectiveId, allActions];
  }
}
