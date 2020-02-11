import { injectable } from 'inversify';

import { HasChildren, Hashed, Signed } from '@uprtcl/cortex';

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
import { CREATE_PERSPECTIVE } from '../graphql/queries';
import gql from 'graphql-tag';
import { Secured } from 'src/patterns/default-secured.pattern';
import { cacheActions } from 'src/utils/actions';

export interface OwnerPreservingConfig {
  targetCanWrite: string;
  targetAuthority: string;
}

@injectable()
export class OwnerPreservingMergeStrategy extends RecursiveContextMergeStrategy {
  async getEntity(id: string): Promise<Hashed<any>> {
    const result = await this.client.query({
      query: gql`{
        entity(id: "${id}") {
          id
          _context {
            raw
          }
        }
      }`
    });

    const object = JSON.parse(result.data.entity._context.raw);
    return { id, object };
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
        .recognize(oldData)
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
      .recognize(newData)
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
              entity(id: "${newLink}") {
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
                headId,
                context,
                name: `from${name ? '-' + name : ''}`
              },
              targetCanWrite
            );

            await cacheActions(actions, this.entityCache, this.client);

            /** for each new perspective that is created,
             *  craete a new commit and data
             * (should be a clone but we dont have "clone" mutations and the id
             *  changes when you create the same entity on another remote)  */
            for (let ix = 0; ix < actions.length; ix++) {
              const action = actions[ix];
              if (action.type !== CREATE_AND_INIT_PERSPECTIVE_ACTION) break;

              const headId = action.payload.details.headId;
              const remote = this.evees.getAuthority(targetAuthority);

              const oldHead: Secured<Commit> | undefined = await this.getEntity(headId);
              if (!oldHead) throw new Error(`Error getting the cached head: ${headId}`);

              const oldData = await this.getEntity(oldHead.object.payload.dataId);

              const newData = await this.hashed.derive()(oldData.object, remote.hashRecipe);
              const newDataAction: UprtclAction = {
                type: CREATE_DATA_ACTION,
                entity: newData,
                payload: {
                  source: remote.source
                }
              };

              /** build new head object pointing to new data */
              const newHeadObject: Signed<Commit> = {
                payload: {
                  ...oldHead.object.payload,
                  dataId: newData.id
                },
                proof: {
                  type: '',
                  signature: ''
                }
              };

              const newHead = await this.hashed.derive()(newHeadObject, remote.hashRecipe);

              const newCommitAction: UprtclAction = {
                type: CREATE_COMMIT_ACTION,
                entity: newHead,
                payload: {
                  source: remote.source
                }
              };

              /** replace head in headupdate action */
              actions[ix].payload.details.headId = newHead.id;

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

      const newNewData = newHasChildren.replaceChildrenLinks(newData)(newNewLinks) as Hashed<any>;
      const actions = await this.updatePerspectiveData(
        updateRequest.perspectiveId,
        newNewData.object
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
        const removedHeadUpdate = mergeActionsNew.splice(ixHeadUpdate, 1)[0];

        /** remove create commit associated to that head update */
        /*         const ixCreateCommit = mergeActionsNew.findIndex(action => {
          if (!action.entity) return false;
          return (
            action.type === CREATE_COMMIT_ACTION &&
            action.entity.id === (removedHeadUpdate.payload as UpdateRequest).newHeadId
          );
        });

        const removedCreateCommit = mergeActionsNew.splice(ixCreateCommit, 1)[0];

         remove create data associated to that commit 
        const ixCreateData = mergeActionsNew.findIndex(action => {
          if (!action.entity) return false;
          return (
            action.type === CREATE_DATA_ACTION &&
            action.entity.id ===
              (removedCreateCommit.entity as Secured<Commit>).object.payload.dataId
          );
        }); 
        
        mergeActionsNew.splice(ixCreateData, 1);
       */
      });

    const allActions = mergeActionsNew.concat(ownerPreservingActions);

    return [finalPerspectiveId, allActions];
  }
}
