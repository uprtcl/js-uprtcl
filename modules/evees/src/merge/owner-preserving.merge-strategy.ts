import { injectable } from 'inversify';

import { HasChildren, Hashed } from '@uprtcl/cortex';

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

  async computeActions(
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

            // TODO: optimize and remove from the list the perspectives that have already had their head updated

            for (const action of actions.filter(
              a => a.type === CREATE_AND_INIT_PERSPECTIVE_ACTION
            )) {
              const headId = action.payload.details.headId;
              const remote = this.evees.getAuthority(targetAuthority);

              const head: Secured<Commit> | undefined = await this.getEntity(headId);

              if (!head) throw new Error(`Error getting the cached head: ${headId}`);

              const newCommitAction: UprtclAction = {
                type: CREATE_COMMIT_ACTION,
                entity: head,
                payload: {
                  source: remote.source
                }
              };

              actions.push(newCommitAction);

              const data = await this.getEntity(head.object.payload.dataId);
              const newDataAction: UprtclAction = {
                type: CREATE_DATA_ACTION,
                entity: data,
                payload: {
                  source: remote.source
                }
              };

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
      const action = {
        type: UPDATE_HEAD_ACTION,
        payload: updateRequest
      };

      return [action];
    }
  }

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: OwnerPreservingConfig
  ): Promise<[string, UprtclAction[]]> {
    const [finalPerspectiveId, updatesList] = await super.mergePerspectives(
      toPerspectiveId,
      fromPerspectiveId,
      config
    );

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

    const updateHeads = updatesList.filter(a => a.type === UPDATE_HEAD_ACTION);
    const forceOwnerPromises = updateHeads.map(updateHead =>
      this.computeActions(updateHead.payload, targetAuthority, targetCanWrite)
    );

    const newUpdatesList = await Promise.all(forceOwnerPromises);

    const actions = ([] as UprtclAction[]).concat(...newUpdatesList);
    return [finalPerspectiveId, actions];
  }
}
