import { injectable } from 'inversify';

import { HasChildren, Hashed } from '@uprtcl/cortex';

import {
  UpdateRequest,
  UprtclAction,
  UPDATE_HEAD_ACTION,
  NodeActions
} from '../types';
import { RecursiveContextMergeStrategy } from './recursive-context.merge-strategy';
import gql from 'graphql-tag';
import { cacheActions } from '../utils/actions';

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

  async forceOwnerPreserving(
    perspectiveId: string, 
    targetAuthority: string, 
    targetCanWrite: string): Promise<NodeActions<string>> {
      
    let fork = false;

    const result = await this.client.query({
      query: gql`{
        entity(id: "${perspectiveId}") {
          id

          ... on Perspective {
            payload {
              origin
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
      const forkPerspective = await this.evees.fork(
        perspectiveId,
        targetAuthority,
        targetCanWrite,
        '',
        context,
        name
      );

      await cacheActions(forkPerspective.actions, this.entityCache, this.client);

      return forkPerspective;

    } else {

      return { 
        id: perspectiveId, 
        actions: []
      };
    }
  }

  getEntityChildren(entity: object) {
    let hasChildren: HasChildren | undefined = this.recognizer
      .recognize(entity)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) {
      return [];
    } else {
      return hasChildren.getChildrenLinks(entity);
    }
  }

  replaceEntityChildren(entity: object, newLinks: string[]) {
    let hasChildren: HasChildren | undefined = this.recognizer
      .recognize(entity)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) {
      return [];
    } else {
      return hasChildren.replaceChildrenLinks(entity)(newLinks);
    }
  }

  async getOwnerPreservingActions(
    updateRequest: UpdateRequest,
    targetAuthority: string,
    targetCanWrite: string
  ): Promise<UprtclAction[]> {
    let oldLinks: string[] = [];

    if (updateRequest.oldHeadId) {
      const oldData = await this.loadCommitData(updateRequest.oldHeadId);
      oldLinks = this.getEntityChildren(oldData);
    }

    const data = await this.loadCommitData(updateRequest.newHeadId);
    const newLinks = this.getEntityChildren(data.object);

    /**
     * Check for each newLink that was not an old link if the authority and canWrite are the
     * target, if not, create a global perspective on the targetAuthority where targetCanWrite canWrite
     */
    const newNewLinksPromises = newLinks.map(
      async (newLink): Promise<NodeActions<string>> => {
        if (!oldLinks.includes(newLink)) {
          return this.forceOwnerPreserving(newLink, targetAuthority, targetCanWrite);
        } else {
          return { id: newLink, actions: [] };
        }
      }
    );

    const linksNodeActions = await Promise.all(newNewLinksPromises);

    const newNewLinks = linksNodeActions.map(node => node.id);
    const newObject = this.replaceEntityChildren(data.object, newNewLinks);
    
    const source = this.remotesConfig.map(targetAuthority);
    const newData = await this.hashed.derive()(newObject, source.hashRecipe);

    if (newData.id !== data.id) {
      /** create a new commit with the new links and update perspective head */
      const actions = await this.updatePerspectiveData(
        updateRequest.perspectiveId,
        newData.object
      );

      /** add actions  */
      return actions.concat(...linksNodeActions.map(node => node.actions));
    } else {
      const action = this.buildUpdateAction(updateRequest);
      return [action];
    }
  }

  depth: number = 0;

  async mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string
  ): Promise<NodeActions<string>> {

    this.depth++;

    const originalMerge = await super.mergePerspectives(
      toPerspectiveId,
      fromPerspectiveId
    );

    this.depth--;

    if (this.depth > 0) return originalMerge;

    await cacheActions(originalMerge.actions, this.entityCache, this.client);

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

    const updateHeads = originalMerge.actions.filter(a => a.type === UPDATE_HEAD_ACTION);
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
