import { Entity, PatternRecognizer, HasChildren, Signed } from '@uprtcl/cortex';

import { Commit, EveesConfig, Perspective } from '../types';
import { signObject } from '../utils/signed';
import { hashObject, Secured } from '../utils/cid-hash';
import { Client } from './client';
import { RemoteEvees } from './remote.evees';
import { EveesContentModule } from '../evees.content.module';
import { PerspectiveType } from '../patterns/perspective.pattern';
import { CommitType } from '../patterns/commit.pattern';
import { RecursiveContextMergeStrategy } from 'src/merge/recursive-context.merge-strategy';

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

export class Evees {
  constructor(
    readonly client: Client,
    readonly recognizer: PatternRecognizer,
    readonly remotes: RemoteEvees[],
    readonly merge: RecursiveContextMergeStrategy,
    readonly config: EveesConfig,
    readonly modules?: EveesContentModule[]
  ) {}

  clone(client: Client): Evees {
    return new Evees(client, this.recognizer, this.remotes, this.merge, this.config, this.modules);
  }

  async getRemote(remoteId: string): Promise<RemoteEvees> {
    const remote = this.remotes.find((r) => r.id === remoteId);
    if (!remote) throw new Error(`remote ${remoteId} not found`);
    return remote;
  }

  async getPerspectiveRemote(perspectiveId: string, client?: Client): Promise<RemoteEvees> {
    client = client || this.client;
    const perspective = await client.store.getEntity(perspectiveId);
    if (!perspective) throw new Error('perspective not found');
    const remoteId = perspective.object.payload.remote;
    return this.getRemote(remoteId);
  }

  async getPerspectiveContext(perspectiveId: string, client?: Client): Promise<string> {
    client = client || this.client;
    const perspective = await client.store.getEntity(perspectiveId);
    if (!perspective) throw new Error('perspective not found');
    return perspective.object.payload.context;
  }

  async getPerspectiveDataId(perspectiveId: string, client?: Client): Promise<string | undefined> {
    client = client || this.client;
    const result = await client.getPerspective(perspectiveId);
    if (result.details.headId === undefined) return undefined;
    return this.getCommitDataId(result.details.headId, client);
  }

  async getPerspectiveData(perspectiveId: string, client?: Client): Promise<Entity<any>> {
    client = client || this.client;
    const result = await client.getPerspective(perspectiveId);
    if (result.details.headId === undefined)
      throw new Error(`Data not found for perspective ${perspectiveId}`);
    return this.getCommitData(result.details.headId, client);
  }

  async getCommitData(commitId: string, client?: Client): Promise<Entity<any>> {
    client = client || this.client;
    const dataId = await this.getCommitDataId(commitId, client);
    const data = await client.store.getEntity(dataId);
    return data;
  }

  async getCommitDataId(commitId: string, client?: Client): Promise<string> {
    client = client || this.client;
    const commit = await client.store.getEntity(commitId);
    return commit.object.payload.dataId;
  }

  async getData(uref: string, client?: Client) {
    client = client || this.client;
    const entity = await client.store.getEntity(uref);

    let entityType: string = this.recognizer.recognizeType(entity);

    switch (entityType) {
      case PerspectiveType:
        return this.getPerspectiveData(uref, client);

      case CommitType:
        return this.getCommitData(uref, client);

      default:
        return entity;
    }
  }

  async getChildren(
    recognizer: PatternRecognizer,
    uref: string,
    client?: Client
  ): Promise<string[]> {
    const data = await this.getData(uref, client);

    const hasChildren: HasChildren = recognizer
      .recognizeBehaviours(data)
      .find((b) => (b as HasChildren).getChildrenLinks);

    return hasChildren.getChildrenLinks(data);
  }

  async createCommit(
    commit: CreateCommit,
    remote: string,
    client?: Client
  ): Promise<Secured<Commit>> {
    client = client || this.client;

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
    const hash = await client.store.storeEntity(commitObject, remote);
    return {
      id: hash,
      object: commitObject,
    };
  }

  async isAncestorCommit(client: Client, perspectiveId: string, commitId: string, stopAt?: string) {
    const result = await client.getPerspective(perspectiveId);
    if (result.details.headId === undefined) return false;
    const findAncestor = new FindAncestor(client, commitId, stopAt);
    return findAncestor.checkIfParent(result.details.headId);
  }

  async checkEmit(perspectiveId: string, client?: Client): Promise<boolean> {
    client = client || this.client;
    if (this.config.emitIf === undefined) return false;

    const toRemote = await this.getPerspectiveRemote(perspectiveId, client);
    if (toRemote.id === this.config.emitIf.remote) {
      const owner = await (toRemote.accessControl as any).getOwner(perspectiveId);
      return owner === this.config.emitIf.owner;
    }

    return false;
  }

  async snapDefaultPerspective(
    remote: RemoteEvees,
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
      creatorId: creatorId as string,
      remote: remote.id,
      path: path !== undefined ? path : remote.defaultPath,
      timestamp,
      context,
    };

    if (fromPerspectiveId) object.meta.fromPerspectiveId = fromPerspectiveId;
    if (fromHeadId) object.meta.fromHeadId = fromHeadId;

    const hash = await this.client.store.hashEntity(object, remote.id);
    return {
      id: hash,
      object,
    };
  }

  async getHome(
    remote: RemoteEvees,
    userId?: string,
    client?: Client
  ): Promise<Entity<Perspective>> {
    client = client || this.client;

    const creatorId = userId === undefined ? 'root' : userId;
    const remoteHome: Perspective = {
      remote: remote.id,
      path: remote.defaultPath,
      creatorId,
      timestamp: 0,
      context: `${creatorId}.home`,
    };

    const hash = await client.store.hashEntity(remoteHome, remote.id);
    return {
      id: hash,
      object: remoteHome,
    };
  }

  async isOfPattern(uref: string, pattern: string, client?: Client): Promise<boolean> {
    client = client || this.client;
    const entity = await client.store.getEntity(uref);
    const type = this.recognizer.recognizeType(entity);
    return type === pattern;
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
  async fork(id: string, remote: string, parentId?: string, client?: Client): Promise<string> {
    client = client || this.client;
    const isPerspective = await this.isOfPattern(id, PerspectiveType);
    if (isPerspective) {
      return this.forkPerspective(id, remote, parentId, client);
    } else {
      const isCommit = await this.isOfPattern(id, CommitType);
      if (isCommit) {
        return this.forkCommit(id, remote, parentId, client);
      } else {
        return this.forkEntity(id, remote, parentId, client);
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

  async forkPerspective(
    perspectiveId: string,
    remoteId: string,
    parentId?: string,
    client?: Client
  ): Promise<string> {
    client = client || this.client;

    const refPerspective: Entity<Signed<Perspective>> = await client.store.getEntity(perspectiveId);
    const remote = await this.getRemote(remoteId);
    const perspective = await remote.snapPerspective(
      { context: refPerspective.object.payload.context },
      { parentId }
    );

    const { details } = await client.getPerspective(perspectiveId);

    await client.store.storeEntity(perspective.object, remote.id);

    let forkCommitId: string | undefined = undefined;

    if (details.headId !== undefined) {
      forkCommitId = await this.forkCommit(
        details.headId,
        perspective.object.payload.remote,
        perspective.id, // this perspective is set as the parent of the children's new perspectives
        client
      );
    }

    client.update({
      newPerspectives: [
        {
          perspective,
          details: { headId: forkCommitId },
          links: { parentId },
        },
      ],
    });

    return perspective.id;
  }

  async forkCommit(
    commitId: string,
    remote: string,
    parentId?: string,
    client?: Client
  ): Promise<string> {
    client = client || this.client;

    const commit: Secured<Commit> | undefined = await client.store.getEntity(commitId);

    const dataId = commit.object.payload.dataId;
    const dataForkId = await this.forkEntity(dataId, remote, parentId, client);

    const eveesRemote = await this.getRemote(remote);

    /** build new head object pointing to new data */
    const newCommit: Commit = {
      creatorsIds: eveesRemote.userId ? [eveesRemote.userId] : [''],
      dataId: dataForkId,
      message: `autocommit to fork ${commitId} on remote ${remote}`,
      forking: commitId,
      parentsIds: [],
      timestamp: Date.now(),
    };

    return client.store.storeEntity(newCommit, remote);
  }

  async forkEntity(
    entityId: string,
    remote: string,
    parentId?: string,
    client?: Client
  ): Promise<string> {
    client = client || this.client;
    const data = await client.store.getEntity(entityId);
    if (!data) throw new Error(`data ${entityId} not found`);

    /** createOwnerPreservingEntity of children */
    const getLinksForks = this.getEntityChildren(data).map((link) =>
      this.fork(link, remote, parentId, client)
    );
    const newLinks = await Promise.all(getLinksForks);
    const tempData = this.replaceEntityChildren(data, newLinks);

    return client.store.storeEntity(tempData.object, remote);
  }
}

export class FindAncestor {
  done = false;

  constructor(protected client: Client, protected lookingFor: string, protected stopAt?: string) {}

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

    const commit = await this.client.store.getEntity(commitId);

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
