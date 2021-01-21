import { signObject } from '../cas/utils/signed';
import { Secured } from '../cas/utils/cid-hash';
import { Client } from './interfaces/client';
import { EveesContentModule } from './interfaces/evees.content.module';
import { PerspectiveType } from './patterns/perspective.pattern';
import { CommitType } from './patterns/commit.pattern';
import { RecursiveContextMergeStrategy } from 'src/evees/merge/recursive-context.merge-strategy';
import { EveesConfig, Commit, Perspective } from './interfaces/types';
import { Entity } from 'src/cas/interfaces/entity';
import { HasChildren } from 'src/patterns/behaviours/has-links';
import { Signed } from 'src/patterns/interfaces/signable';
import { PatternRecognizer } from 'src/patterns/recognizer/pattern-recognizer';
import { RemoteEvees } from './interfaces/remote.evees';
import { getHome } from './default.perspectives';

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
    readonly modules: Map<string, EveesContentModule>
  ) {}

  clone(client: Client): Evees {
    return new Evees(client, this.recognizer, this.remotes, this.merge, this.config, this.modules);
  }

  findRemote(query: string): RemoteEvees {
    const remote = this.remotes.find((r) => r.id.startsWith(query));
    if (!remote) throw new Error(`remote starting with ${query} not found`);
    return remote;
  }

  getRemote(remoteId: string): RemoteEvees {
    const remote = this.remotes.find((r) => r.id === remoteId);
    if (!remote) throw new Error(`remote ${remoteId} not found`);
    return remote;
  }

  async getPerspectiveRemote(perspectiveId: string): Promise<RemoteEvees> {
    const perspective = await this.client.store.getEntity(perspectiveId);
    if (!perspective) throw new Error('perspective not found');
    const remoteId = perspective.object.payload.remote;
    return this.getRemote(remoteId);
  }

  async getPerspectiveContext(perspectiveId: string): Promise<string> {
    const perspective = await this.client.store.getEntity(perspectiveId);
    if (!perspective) throw new Error('perspective not found');
    return perspective.object.payload.context;
  }

  async getPerspectiveData(perspectiveId: string): Promise<Entity<any>> {
    const result = await this.client.getPerspective(perspectiveId);
    if (result.details.headId === undefined)
      throw new Error(`Data not found for perspective ${perspectiveId}`);
    return this.getCommitData(result.details.headId);
  }

  async getCommitData(commitId: string): Promise<Entity<any>> {
    const dataId = await this.getCommitDataId(commitId);
    const data = await this.client.store.getEntity(dataId);
    return data;
  }

  async getCommitDataId(commitId: string): Promise<string> {
    const commit = await this.client.store.getEntity(commitId);
    return commit.object.payload.dataId;
  }

  async getData(uref: string) {
    const entity = await this.client.store.getEntity(uref);

    let entityType: string = this.recognizer.recognizeType(entity.object);

    switch (entityType) {
      case PerspectiveType:
        return this.getPerspectiveData(uref);

      case CommitType:
        return this.getCommitData(uref);

      default:
        return entity;
    }
  }

  behavior(object: object, behaviorName: string) {
    const behaviors = this.recognizer.recognizeBehaviours(object);
    const behavior = behaviors.find((b) => b[behaviorName]);
    return behavior[behaviorName](object);
  }

  async createEvee(object: any, remoteId: string, parentId?: string): Promise<string> {
    const dataId = await this.client.store.storeEntity({
      object,
      remote: remoteId,
    });

    const head = await this.createCommit(
      {
        dataId,
      },
      remoteId
    );
    const remote = await this.getRemote(remoteId);
    const perspective = await remote.snapPerspective({});
    await this.client.newPerspective({
      perspective,
      details: {
        headId: head.id,
      },
      links: {
        parentId,
      },
    });
    return perspective.id;
  }

  async updatePerspectiveData(perspectiveId: string, newData: any, onHeadId?: string) {
    const remote = await this.getPerspectiveRemote(perspectiveId);
    const dataId = await this.client.store.storeEntity({ object: newData, remote: remote.id });
    if (!onHeadId) {
      const { details } = await this.client.getPerspective(perspectiveId);
      onHeadId = details.headId;
    }
    const head = await this.createCommit(
      {
        dataId,
        parentsIds: onHeadId ? [onHeadId] : undefined,
      },
      remote.id
    );

    await this.client.updatePerspective({ perspectiveId, newHeadId: head.id });
  }

  async getChildren(recognizer: PatternRecognizer, uref: string): Promise<string[]> {
    const data = await this.getData(uref);

    const hasChildren: HasChildren = recognizer
      .recognizeBehaviours(data)
      .find((b) => (b as HasChildren).getChildrenLinks);

    return hasChildren.getChildrenLinks(data);
  }

  async spliceChildren(
    object: any,
    newElements: any[],
    index: number,
    count: number,
    remoteId?: string
  ) {
    const getNewChildren = newElements.map((page) => {
      if (typeof page !== 'string') {
        remoteId = remoteId || this.remotes[0].id;
        return this.createEvee(page, remoteId);
      } else {
        return Promise.resolve(page);
      }
    });

    const newChildren = await Promise.all(getNewChildren);

    /** get children pattern */
    const childrentPattern: HasChildren = this.recognizer
      .recognizeBehaviours(object)
      .find((b) => (b as HasChildren).getChildrenLinks);

    /** get array with current children */
    const children = childrentPattern.getChildrenLinks(object);

    /** updated array with new elements */
    const removed = children.splice(index, count, ...newChildren);
    const newEntity = childrentPattern.replaceChildrenLinks(object)(children);

    return {
      entity: newEntity,
      removed,
    };
  }

  async moveChild(object: any, fromIndex: number, toIndex: number): Promise<Entity<any>> {
    const { removed } = await this.spliceChildren(object, [], fromIndex, 1);
    const result = await this.spliceChildren(object, removed as string[], toIndex, 0);
    return result.entity;
  }

  async removeChild(object: any, index: number): Promise<Entity<any>> {
    const result = await this.spliceChildren(object, [], index, 1);
    return result.entity;
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
    const hash = await client.store.storeEntity({ object: commitObject, remote });
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

    const toRemote = await this.getPerspectiveRemote(perspectiveId);
    if (toRemote.id === this.config.emitIf.remote) {
      const owner = await (toRemote.accessControl as any).getOwner(perspectiveId);
      return owner === this.config.emitIf.owner;
    }

    return false;
  }

  async isOfPattern(uref: string, pattern: string, client?: Client): Promise<boolean> {
    client = client || this.client;
    const entity = await client.store.getEntity(uref);
    const type = this.recognizer.recognizeType(entity.object);
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

    await client.store.storeEntity({ object: perspective.object, remote: remote.id });

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

    const commit: Secured<Commit> = await client.store.getEntity(commitId);

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

    return client.store.storeEntity({ object: newCommit, remote });
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

    return client.store.storeEntity({ object: tempData.object, remote });
  }

  async getHome(remoteId: string) {
    const remote = this.getRemote(remoteId);
    /** build the default home perspective  */
    const home = await getHome(remote, remote.userId);
    /** make sure the homePerspective entity is stored on the store */
    await this.client.store.storeEntity({ object: home.object, remote: remote.id });

    return home;
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
