import { injectable } from 'inversify';

import { HasChildren, Hashed } from '@uprtcl/cortex';

import { UpdateRequest, RemotesConfig, UprtclAction, UPDATE_HEAD_ACTION } from '../types';
import { RecursiveContextMergeStrategy } from './recursive-context.merge-strategy';
import { CREATE_PERSPECTIVE } from '../graphql/queries';
import gql from 'graphql-tag';

export interface OwnerPreservingConfig {
  targetCanWrite: string;
  targetAuthority: string;
}

@injectable()
export class OwnerPreservingMergeStrategy extends RecursiveContextMergeStrategy {
  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: OwnerPreservingConfig
  ): Promise<UprtclAction[]> {
    await super.mergePerspectives(toPerspectiveId, fromPerspectiveId, config);

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

    const updateHeads = this.updatesList.filter(a => a.type === UPDATE_HEAD_ACTION);
    const forceOwnerPromises = updateHeads.map(
      async (updateHead): Promise<UpdateRequest> => {
        const updateRequest = updateHead.payload;
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
          async (newLink): Promise<string> => {
            if (!oldLinks.includes(newLink)) {
              let fork = false;

              /** TODO: instead of using getPerspectiveProviderById, get access control
               * from pattern and generalize to not-to-perspective links */
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
              const remote = this.evees.getAuthority(authority);

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
                const perspectiveMutation = await this.client.mutate({
                  mutation: CREATE_PERSPECTIVE,
                  variables: {
                    headId: headId,
                    context: context,
                    timestamp: Date.now(),
                    name: `from${name ? '-' + name : ''}`,
                    origin: targetAuthority,
                    creatorId: remote.userId,
                    authority: targetAuthority,
                    canWrite: targetCanWrite,
                    recursive: true
                  }
                });

                return perspectiveMutation.data.createPerspective.id;
              }

              /** if fork false, simple return the same link */
              return newLink;
            } else {
              return newLink;
            }
          }
        );

        const newNewLinks = await Promise.all(newNewLinksPromises);

        const sameLinks =
          newNewLinks.length === newLinks.length &&
          newNewLinks.every((value, index) => value === newLinks[index]);
        if (!sameLinks) {
          /** create a new data and commit with the new links and update perspective head */
          if (!newHasChildren)
            throw new Error('Target data dont have children, cant update its links');

          const newNewData = newHasChildren.replaceChildrenLinks(newData)(newNewLinks) as Hashed<
            any
          >;
          const newUpdateRequest = await this.updatePerspectiveData(
            updateRequest.perspectiveId,
            newNewData.object
          );

          return newUpdateRequest;
        } else {
          return updateRequest;
        }
      }
    );

    const newUpdatesList = await Promise.all(forceOwnerPromises);

    return newUpdatesList.map(updateRequest => ({
      id: `Update perspective of ${updateRequest.perspectiveId}`,
      type: UPDATE_HEAD_ACTION,
      payload: updateRequest
    }));
  }
}
