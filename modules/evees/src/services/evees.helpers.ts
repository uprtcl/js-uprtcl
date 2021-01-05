import { Entity, PatternRecognizer, HasChildren } from '@uprtcl/cortex';

import { EveesRemote } from './evees.remote';
import { Commit, EveesConfig, Perspective } from '../types';
import { deriveSecured, signObject } from '../utils/signed';
import { EveesBindings } from '../bindings';
import { hashObject, Secured } from '../utils/cid-hash';
import { EveesClient } from './evees.client';

export interface CreateCommit {
  dataId: string;
  parentsIds?: string[];
  creatorsIds?: string[];
  message?: string;
  timestamp?: number;
}

export interface CreatePerspective {
  headId?: string;
  parentId?: string;
  context?: string;
  name?: string;
  canUpdate?: string;
  timestamp?: number;
  creatorId?: string;
}

export class EveesHelpers {
  static async getPerspectiveRemoteId(client: EveesClient, perspectiveId: string): Promise<string> {
    const perspective = await client.getEntity(perspectiveId);
    if (!perspective) throw new Error('perspective not found');
    return perspective.object.payload.remote;
  }

  static async getPerspectiveDataId(
    client: EveesClient,
    perspectiveId: string
  ): Promise<string | undefined> {
    const result = await client.getPerspective(perspectiveId);
    if (result.details.headId === undefined) return undefined;
    return this.getCommitDataId(client, result.details.headId);
  }

  static async getPerspectiveData(
    client: EveesClient,
    perspectiveId: string
  ): Promise<Entity<any> | undefined> {
    const result = await client.getPerspective(perspectiveId);
    if (result.details.headId === undefined) return undefined;
    return this.getCommitData(client, result.details.headId);
  }

  static async getCommitData(client: EveesClient, commitId: string): Promise<Entity<any>> {
    const dataId = await this.getCommitDataId(client, commitId);
    const data = await client.getEntity(dataId);
    if (!data) throw new Error('data not found');
    return data;
  }

  static async getCommitDataId(client: EveesClient, commitId: string): Promise<string> {
    const commit = await client.getEntity(commitId);
    if (!commit) throw new Error('commit not found');
    return commit.object.payload.dataId;
  }

  static async getData(client: EveesClient, recognizer: PatternRecognizer, uref: string) {
    const entity = await client.getEntity(uref);
    if (!entity) return undefined;

    let entityType: string = recognizer.recognizeType(entity);

    switch (entityType) {
      case EveesBindings.PerspectiveType:
        return this.getPerspectiveData(client, uref);

      case EveesBindings.CommitType:
        return this.getCommitData(client, uref);

      default:
        return entity;
    }
  }

  static async getChildren(
    client: EveesClient,
    recognizer: PatternRecognizer,
    uref: string
  ): Promise<string[]> {
    const data = await this.getData(client, recognizer, uref);

    const hasChildren: HasChildren = recognizer
      .recognizeBehaviours(data)
      .find((b) => (b as HasChildren).getChildrenLinks);

    return hasChildren.getChildrenLinks(data);
  }

  static async getDescendantsRec(
    client: EveesClient,
    recognizer: PatternRecognizer,
    uref: string,
    current: string[]
  ): Promise<string[]> {
    const newDescendants: string[] = [];
    const children = await this.getChildren(client, recognizer, uref);
    for (let ix = 0; ix < children.length; ix++) {
      const child = children[ix];
      const thisDescendants = await this.getDescendantsRec(client, recognizer, child, []);
      newDescendants.push(child);
      newDescendants.push(...thisDescendants);
    }
    return current.concat(newDescendants);
  }

  static async getDescendants(
    client: EveesClient,
    recognizer: PatternRecognizer,
    uref: string
  ): Promise<string[]> {
    return this.getDescendantsRec(client, recognizer, uref, []);
  }

  static async createCommit(client: EveesClient, commit: CreateCommit) {
    const message = commit.message !== undefined ? commit.message : '';
    const timestamp = commit.timestamp !== undefined ? commit.timestamp : Date.now();
    const creatorsIds = commit.creatorsIds !== undefined ? commit.creatorsIds : [];
    const parentsIds = commit.parentsIds !== undefined ? commit.parentsIds : [];

    const commitData: Commit = {
      creatorsIds: creatorsIds,
      dataId: commit.dataId,
      message: message,
      timestamp: timestamp,
      parentsIds: parentsIds,
    };

    const commitObject = signObject(commitData);

    const create = await client.storeEntities([commitObject]);

    return create.data.createEntity.id;
  }

  static async isAncestorCommit(
    client: EveesClient,
    perspectiveId: string,
    commitId: string,
    stopAt?: string
  ) {
    const result = await client.getPerspective(perspectiveId);
    if (result.details.headId === undefined) return false;
    const findAncestor = new FindAncestor(client, commitId, stopAt);
    return findAncestor.checkIfParent(result.details.headId);
  }

  static async checkEmit(
    config: EveesConfig,
    client: EveesClient,
    eveesRemotes: EveesRemote[],
    perspectiveId: string
  ): Promise<boolean> {
    if (config.emitIf === undefined) return false;

    const remoteId = await EveesHelpers.getPerspectiveRemoteId(client, perspectiveId);
    const toRemote = eveesRemotes.find((r) => r.id === remoteId);
    if (!toRemote) throw new Error(`remote not found for ${remoteId}`);

    if (remoteId === config.emitIf.remote) {
      const owner = await (toRemote.accessControl as any).getOwner(perspectiveId);
      return owner.toLocaleLowerCase() === config.emitIf.owner.toLocaleLowerCase();
    }

    return false;
  }

  static async snapDefaultPerspective(
    remote: EveesRemote,
    creatorId?: string,
    context?: string,
    timestamp?: number,
    path?: string,
    fromPerspectiveId?: string,
    fromHeadId?: string
  ) {
    creatorId = creatorId ? creatorId : remote.userId ? remote.userId : '';
    timestamp = timestamp !== undefined ? timestamp : Date.now();

    const defaultContext = await hashObject({
      creatorId,
      timestamp,
    });

    context = context || defaultContext;

    const object: Perspective = {
      creatorId,
      remote: remote.id,
      path: path !== undefined ? path : remote.defaultPath,
      timestamp,
      context,
    };

    if (fromPerspectiveId) object.fromPerspectiveId = fromPerspectiveId;
    if (fromHeadId) object.fromHeadId = fromHeadId;

    const perspective = await deriveSecured<Perspective>(object, remote.store.cidConfig);
    perspective.casID = remote.store.casID;
    return perspective;
  }

  static async getHome(remote: EveesRemote, userId?: string): Promise<Secured<Perspective>> {
    const creatorId = userId === undefined ? 'root' : userId;
    const remoteHome = {
      remote: remote.id,
      path: remote.defaultPath,
      creatorId,
      timestamp: 0,
      context: `${creatorId}.home`,
    };

    return deriveSecured(remoteHome, remote.store.cidConfig);
  }

  static async isPerspective(id: string): Promise<boolean> {
    const entity = await loadEntity(client, id);
    if (entity === undefined) throw new Error('entity not found');
    const type = recognizer.recognizeType(entity);
    return type === 'Perspective';
  }

  /**
   * receives an entity id and compute the actions that will
   * result on this entity being forked on a target remote
   * with a target owner (canUpdate).
   *
   * it also makes sure that all entities are clonned
   * on the target remote default store.
   *
   * recursively fork entity children
   */
  public async fork(
    id: string,
    client: EveesClient,
    remote: string,
    parentId?: string
  ): Promise<string> {
    const isPerspective = await EveesHelpers.isPattern(id, EveesBindings.PerspectiveType);
    if (isPerspective) {
      return EveesHelpers.forkPerspective(id, client, remote, parentId);
    } else {
      const isCommit = await EveesHelpers.isPattern(id, EveesBindings.CommitType);
      if (isCommit) {
        return EveesHelpers.forkCommit(id, client, remote, parentId);
      } else {
        return EveesHelpers.forkEntity(id, client, remote, parentId);
      }
    }
  }

  getEntityChildren(entity: object) {
    let hasChildren: HasChildren | undefined = this.recognizer
      .recognizeBehaviours(entity)
      .find((prop) => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) {
      return [];
    } else {
      return hasChildren.getChildrenLinks(entity);
    }
  }

  replaceEntityChildren(entity: object, newLinks: string[]) {
    let hasChildren: HasChildren | undefined = this.recognizer
      .recognizeBehaviours(entity)
      .find((prop) => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) {
      throw new Error(`entity dont hasChildren ${JSON.stringify(entity)}`);
    } else {
      return hasChildren.replaceChildrenLinks(entity)(newLinks);
    }
  }

  static async forkPerspective(
    perspectiveId: string,
    client: EveesClient,
    remote?: string,
    parentId?: string,
    name?: string
  ): Promise<string> {
    const refPerspective = await client.getEntity(perspectiveId);
    if (!refPerspective) throw new Error(`base perspective ${perspectiveId} not found`);

    const { details: headId } = await client.getPerspective(perspectiveId);

    const perspective = await client.snapPerspective(
      parentId,
      refPerspective.object.payload.context,
      undefined,
      undefined,
      perspectiveId,
      headId
    );

    await client.storeEntities([perspective.object]);

    let forkCommitId: string | undefined = undefined;

    if (headId !== undefined) {
      forkCommitId = await this.forkCommit(
        headId,
        client,
        perspective.id // this perspective is set as the parent of the children's new perspectives
      );
    }

    client.newPerspective({
      perspective,
      details: { headId: forkCommitId, name },
      parentId,
    });

    return perspective.id;
  }

  static async forkCommit(
    commitId: string,
    client: EveesClient,
    remote: string,
    parentId?: string
  ): Promise<string> {
    const commit: Secured<Commit> | undefined = await client.getEntity(commitId);
    if (!commit) throw new Error(`Could not find commit with id ${commitId}`);

    const remoteInstance = this.getRemote(remote);

    const dataId = commit.object.payload.dataId;
    const dataForkId = await this.forkEntity(dataId, client, remote, parentId);

    const eveesRemote = this.getRemote(remote);

    /** build new head object pointing to new data */
    const newCommit: Commit = {
      creatorsIds: eveesRemote.userId ? [eveesRemote.userId] : [''],
      dataId: dataForkId,
      message: `autocommit to fork ${commitId} on remote ${remote}`,
      forking: commitId,
      parentsIds: [],
      timestamp: Date.now(),
    };

    const newHead: Secured<Commit> = await client.storeEntities([newCommit]);

    return newHead.id;
  }

  static async forkEntity(
    entityId: string,
    client: EveesClient,
    remote: string,
    parentId?: string
  ): Promise<string> {
    const data = await client.get(entityId);
    if (!data) throw new Error(`data ${entityId} not found`);

    /** createOwnerPreservingEntity of children */
    const getLinksForks = this.getEntityChildren(data).map((link) =>
      this.fork(link, client, remote, parentId)
    );
    const newLinks = await Promise.all(getLinksForks);
    const tempData = this.replaceEntityChildren(data, newLinks);

    const newData = await client.storeEntities([tempData.object]);
    return newData.id;
  }
}

export class FindAncestor {
  done = false;

  constructor(
    protected client: EveesClient,
    protected lookingFor: string,
    protected stopAt?: string
  ) {}

  async checkIfParent(commitId: string) {
    /* stop searching all paths once one path finds it */
    if (this.done) {
      return false;
    }

    if (this.lookingFor === commitId) {
      this.done = true;
      return true;
    }

    if (this.stopAt !== undefined) {
      if (this.stopAt === commitId) {
        this.done = true;
        return false;
      }
    }

    const commit = await this.client.getEntity(commitId);
    if (!commit) throw new Error(`commit ${commitId} not found`);

    if (commit.object.payload.parentsIds.length === 0) {
      return false;
    }

    const seeParents = await Promise.all(
      commit.object.payload.parentsIds.map((parentId) => {
        /* recursively look on parents */
        return this.checkIfParent(parentId);
      })
    );

    return seeParents.includes(true);
  }
}
