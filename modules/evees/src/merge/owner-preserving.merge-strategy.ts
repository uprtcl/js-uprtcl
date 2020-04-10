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
import gql from 'graphql-tag';
import { Secured } from '../patterns/default-secured.pattern';
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

  async getOwnerPreservingLink(
    link: string,
    targetAuthority: string, 
    targetCanWrite: string) : Promise<NodeActions> {

    const isPerspective = await this.isPattern(link, "Perspective");
    if (isPerspective) {
      return this.createOwnerPreservingPerspective(link, targetAuthority, targetCanWrite);
    } else {
      const isCommit = await this.isPattern(link, "Commit");
      if (isCommit) {
        return this.createOwnerPreservingCommit(link, targetAuthority, targetCanWrite);
      } else {
        return this.createOwnerPreservingEntity(link, targetAuthority, targetCanWrite);
      }
    }
  }

  async createOwnerPreservingPerspective(
    id: string, 
    targetAuthority: string, 
    targetCanWrite: string): Promise<NodeActions> {
      
    let fork = false;

    const result = await this.client.query({
      query: gql`{
        entity(id: "${id}") {
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

      return {
        id: perspective.id, 
        actions
      };

    } else {

      return { 
        id, 
        actions: []
      };
    }
  }

  async createOwnerPreservingCommit(
    link: string, 
    targetAuthority: string, 
    targetCanWrite: string) : Promise<NodeActions> {

    const commit = this.discovery.get(link) as unknown as Hashed<Signed<Commit>>;
    const remote = this.evees.getAuthority(targetAuthority);

    const dataId = commit.object.payload.dataId;
    const dataResult = await this.createOwnerPreservingEntity(dataId, targetAuthority, targetCanWrite);

    /** build new head object pointing to new data */
    const newHeadObject: Signed<Commit> = {
      payload: {
        ...commit.object.payload,
        dataId: dataResult.id
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

    return {
      id: newHead.id, 
      actions: [newCommitAction].concat(dataResult.actions)
    }
  }

  /** It takes an entity and makes sure all its children are either cloned or branched in the targetAuthority and are owned
   * by the targetCanWrite. The data entity id might change because the targetAuthority hashRecipe is different or because
   * there new (owner preserving) perspectives were created insde the data object */
  async createOwnerPreservingEntity(id: string, targetAuthority: string, targetCanWrite: string) : Promise<NodeActions>{
    const data = await this.discovery.get(id);
    if (!data) throw new Error(`data ${id} not found`);

    /** createOwnerPreservingEntity of children */
    const oldLinks = this.getEntityChildren(data);
    const getOwnerPreservingLinks = oldLinks.map(link => this.getOwnerPreservingLink(link, targetAuthority, targetCanWrite))
    const newLinksNodeActions = await Promise.all(getOwnerPreservingLinks);
    const newLinks = newLinksNodeActions.map(node => node.id);

    const newObject = this.replaceEntityChildren(data, newLinks);

    const source = this.remotesConfig.map(targetAuthority);
    const newData = await this.hashed.derive()(newObject, source.hashRecipe);

    const newDataAction: UprtclAction = {
      type: CREATE_DATA_ACTION,
      entity: newData,
      payload: {
        source: source.source
      }
    };

    return {
      id: newData.id,
      actions: [newDataAction].concat(...newLinksNodeActions.map(node => node.actions))
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
      async (newLink): Promise<NodeActions> => {
        if (!oldLinks.includes(newLink)) {
          return this.getOwnerPreservingLink(newLink, targetAuthority, targetCanWrite);
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
