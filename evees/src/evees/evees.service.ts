import { signObject } from '../cas/utils/signed';
import { Secured } from '../cas/utils/cid-hash';
import { Client } from './interfaces/client';
import { EveesContentModule } from './interfaces/evees.content.module';
import { PerspectiveType } from './patterns/perspective.pattern';
import { CommitType } from './patterns/commit.pattern';
import {
  EveesConfig,
  Commit,
  Perspective,
  CreateEvee,
  NewPerspective,
  Update,
  ForkDetails,
} from './interfaces/types';
import { Entity } from '../cas/interfaces/entity';
import { HasChildren } from '../patterns/behaviours/has-links';
import { Signed } from '../patterns/interfaces/signable';
import { PatternRecognizer } from '../patterns/recognizer/pattern-recognizer';
import { RemoteEvees } from './interfaces/remote.evees';
import { getHome } from './default.perspectives';
import { ClientOnMemory } from './clients/client.memory';

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
    readonly config: EveesConfig,
    readonly modules: Map<string, EveesContentModule>
  ) {}

  /** Clone a new Evees service using another client that keeps the client of the curren service as it's based
   * client. Useful to create temporary workspaces to compute differences and merges without affecting the app client. */
  clone(client?: Client): Evees {
    client = client || new ClientOnMemory(this.client, this.client.store);
    return new Evees(client, this.recognizer, this.remotes, this.config, this.modules);
  }

  findRemote(query: string): RemoteEvees {
    const remote = this.remotes.find((r) => r.id.startsWith(query));
    if (!remote) throw new Error(`remote starting with ${query} not found`);
    return remote;
  }

  getRemote(remoteId?: string): RemoteEvees {
    if (remoteId) {
      const remote = this.remotes.find((r) => r.id === remoteId);
      if (!remote) throw new Error(`remote ${remoteId} not found`);
      return remote;
    } else {
      return this.remotes[0];
    }
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

  async getPerspectiveData<T = any>(perspectiveId: string): Promise<Entity<T>> {
    const result = await this.client.getPerspective(perspectiveId);
    if (result.details.headId === undefined)
      throw new Error(`Data not found for perspective ${perspectiveId}`);
    return this.getCommitData<T>(result.details.headId);
  }

  async tryGetPerspectiveData<T = any>(perspectiveId: string): Promise<Entity<any> | undefined> {
    const result = await this.client.getPerspective(perspectiveId);
    return result.details.headId ? this.getCommitData<T>(result.details.headId) : undefined;
  }

  async getCommitData<T = any>(commitId: string): Promise<Entity<any>> {
    const dataId = await this.getCommitDataId(commitId);
    const data = await this.client.store.getEntity<T>(dataId);
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
    if (!behavior) throw new Error(`No behaviors found for object ${JSON.stringify(object)}`);
    if (!behavior[behaviorName])
      throw new Error(`Behavior ${behaviorName} not found for object ${JSON.stringify(object)}`);
    return behavior[behaviorName](object);
  }

  /** a helper to add the old details on un update to have a set of added and removed
   * children consiste */
  async checkOldDetails(update: Update): Promise<Update> {
    if (update.oldDetails) {
      return update;
    }

    // the old details are the current details.
    const { details } = await this.client.getPerspective(update.perspectiveId);

    update.oldDetails = details;
    return update;
  }

  /** A helper methods that processes an update and appends the links */
  async checkLinks(update: Update, patternName = 'children'): Promise<Update> {
    if (update.linkChanges) {
      return update;
    }

    const hasData = update.details.headId;

    if (hasData) {
      const data = await this.getCommitData(update.details.headId as string);
      const children = this.behavior(data.object, patternName);
      let oldChildren: string[] = [];

      if (update.oldDetails) {
        const oldData = await this.getCommitData(update.oldDetails.headId as string);
        oldChildren = this.behavior(oldData.object, patternName);
      }

      let addedChildren: string[] = [];
      let removedChildren: string[] = [];

      // identify added and removed children
      const difference = oldChildren
        .filter((oldChild: string) => !children.includes(oldChild))
        .concat(children.filter((newChild: string) => !oldChildren.includes(newChild)));

      difference.map((child) => {
        if (oldChildren.includes(child)) {
          removedChildren.push(child);
        }

        if (children.includes(child)) {
          addedChildren.push(child);
        }
      });

      /** set the details */
      update.linkChanges = {
        [patternName]: {
          added: addedChildren,
          removed: removedChildren,
        },
      };
    }

    return update;
  }

  async prepareUpdate(update: Update) {
    return update;
  }

  /** A helper method that injects the added and remvoed children to a newPerspective object and send it to the client */
  async newPerspective(newPerspective: NewPerspective) {
    newPerspective.update = await this.checkLinks(newPerspective.update);
    return this.client.newPerspective(newPerspective);
  }

  /** A helper method that injects the added and remvoed children to a newPerspective object and send it to the client */
  async updatePerspective(update: Update) {
    update = await this.checkOldDetails(update);
    update = await this.checkLinks(update, 'children');
    update = await this.checkLinks(update, 'linksTo');
    return this.client.updatePerspective(update);
  }

  /**
   * Creates Evee
   *
   * @ {object} remoteId - Remote ID
   * @ {any} object - Unhashed data, a commit and a data entities will be created
   * @ {PartialPerspective} - Optional perspective details
   * @ {string} parentId - ID of the parent object
   */
  async createEvee(input: CreateEvee): Promise<string> {
    let { remoteId } = input;
    const { object, partialPerspective, guardianId } = input;
    remoteId = remoteId || this.remotes[0].id;
    let headId;

    if (object) {
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

      headId = head.id;
    }

    const remote = this.getRemote(remoteId);

    const perspective = await remote.snapPerspective(partialPerspective ? partialPerspective : {});

    await this.newPerspective({
      perspective,
      update: {
        perspectiveId: perspective.id,
        details: {
          headId,
          guardianId,
        },
      },
    });
    return perspective.id;
  }

  async updatePerspectiveData(
    perspectiveId: string,
    object: any,
    onHeadId?: string,
    guardianId?: string
  ) {
    const remote = await this.getPerspectiveRemote(perspectiveId);
    const dataId = await this.client.store.storeEntity({ object, remote: remote.id });
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

    await this.updatePerspective({
      perspectiveId,
      details: {
        headId: head.id,
        guardianId,
      },
    });
  }

  async getPerspectiveChildren(uref: string): Promise<string[]> {
    const data = await this.getPerspectiveData(uref);
    return this.behavior(data.object, 'children');
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
        return this.createEvee({ object: page, remoteId });
      } else {
        return Promise.resolve(page);
      }
    });

    const newChildren = await Promise.all(getNewChildren);

    /** get children pattern */
    const childrentPattern: HasChildren = this.recognizer
      .recognizeBehaviours(object)
      .find((b) => (b as HasChildren).children);

    /** get array with current children */
    const children = childrentPattern.children(object);

    /** updated array with new elements */
    const removed = children.splice(index, count, ...newChildren);
    const newObject = childrentPattern.replaceChildren(object)(children);

    return {
      object: newObject,
      removed,
    };
  }
  /**
   * Add an existing perspective as a child of another and, optionally, set the new parent
   * as the guardian
   */
  async addExistingChild(
    childId: string,
    parentId: string,
    index = 0,
    setGuardian = true
  ): Promise<void> {
    const parentData = await this.getPerspectiveData(parentId);

    const { object: newParentObject } = await this.spliceChildren(
      parentData.object,
      [childId],
      index,
      0
    );
    await this.updatePerspectiveData(parentId, newParentObject, undefined);

    if (setGuardian) {
      await this.updatePerspective({
        perspectiveId: childId,
        details: { guardianId: parentId },
      });
    }
  }

  /**
   * Creates an evee and add it as a child.
   */
  async addNewChild(childObject: object, parentId: string, index = 0): Promise<string> {
    const childId = await this.createEvee({
      object: childObject,
      guardianId: parentId,
    });

    await this.addExistingChild(childId, parentId, index);
    return childId;
  }

  /** moves a child from a perspective into another,
   * optionally
   * - will retain the child in the fromPerspective
   * - will keep the guardian in as the original.
   */
  async moveChild(
    childIdOrIndex: number | string,
    fromId: string,
    toId: string,
    toIndex?: number,
    keepInFrom = false,
    keepGuardian?: boolean
  ): Promise<void> {
    let childIndex;
    if (typeof childIdOrIndex === 'string') {
      childIndex = await this.getChildIndex(fromId, childIdOrIndex);
    }

    let childId;
    if (!keepInFrom) {
      childId = await this.removeChild(fromId, childIndex);
    } else {
      childId = await this.getChildId(fromId, childIndex);
    }

    keepGuardian = keepGuardian !== undefined ? keepGuardian : keepInFrom;
    await this.addExistingChild(childId, toId, toIndex, !keepGuardian);
  }

  /** get the current data of a perspective, removes the i-th child, and updates the data */
  async removeChild(perspectiveId: string, index: number): Promise<string> {
    const data = await this.getPerspectiveData(perspectiveId);
    const spliceResult = await this.spliceChildren(data.object, [], index, 1);
    await this.updatePerspectiveData(perspectiveId, spliceResult.object);
    return spliceResult.removed[0];
  }

  async getChildId(perspectiveId: string, ix: number) {
    const data = await this.getPerspectiveData(perspectiveId);
    const children = this.behavior(data.object, 'children');
    return children[ix];
  }

  async getChildIndex(perspectiveId: string, childId: string): Promise<number> {
    const data = await this.getPerspectiveData(perspectiveId);
    const allChildren = this.behavior(data.object, 'children') as string[];
    const children = allChildren.filter((id) => id === childId);
    if (children.length === 0) {
      return -1;
    } else if (children.length > 1) {
      throw new Error(`More than one child with id ${childId} found in ${perspectiveId}`);
    } else {
      return children.findIndex((id) => id === childId);
    }
  }

  async createCommit(commit: CreateCommit, remote: string): Promise<Secured<Commit>> {
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
    const hash = await this.client.store.storeEntity({ object: commitObject, remote });
    return {
      id: hash,
      object: commitObject,
    };
  }

  async isAncestorCommit(perspectiveId: string, commitId: string, stopAt?: string) {
    const result = await this.client.getPerspective(perspectiveId);
    if (result.details.headId === undefined) return false;
    const findAncestor = new FindAncestor(this.client, commitId, stopAt);
    return findAncestor.checkIfParent(result.details.headId);
  }

  async checkEmit(perspectiveId: string): Promise<boolean> {
    if (this.config.emitIf === undefined) return false;

    const toRemote = await this.getPerspectiveRemote(perspectiveId);
    if (toRemote.id === this.config.emitIf.remote) {
      const owner = await (toRemote.accessControl as any).getOwner(perspectiveId);
      return owner === this.config.emitIf.owner;
    }

    return false;
  }

  async isOfPattern(uref: string, pattern: string): Promise<boolean> {
    const entity = await this.client.store.getEntity(uref);
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
  async fork(id: string, remote: string, parentId?: string): Promise<string> {
    const isPerspective = await this.isOfPattern(id, PerspectiveType);
    if (isPerspective) {
      return this.forkPerspective(id, remote, parentId);
    } else {
      const isCommit = await this.isOfPattern(id, CommitType);
      if (isCommit) {
        return this.forkCommit(id, remote, parentId);
      } else {
        return this.forkEntity(id, remote, parentId);
      }
    }
  }

  async forkPerspective(
    perspectiveId: string,
    remoteId?: string,
    guardianId?: string
  ): Promise<string> {
    const refPerspective: Entity<Signed<Perspective>> = await this.client.store.getEntity(
      perspectiveId
    );
    const remote = await this.getRemote(remoteId);

    const { details } = await this.client.getPerspective(perspectiveId);

    const forking: ForkDetails = {
      perspectiveId: refPerspective.id,
      headId: details.headId,
    };

    const perspective = await remote.snapPerspective(
      { context: refPerspective.object.payload.context, meta: { forking } },
      guardianId
    );

    await this.client.store.storeEntity({ object: perspective.object, remote: remote.id });

    let forkCommitId: string | undefined = undefined;

    if (details.headId !== undefined) {
      forkCommitId = await this.forkCommit(
        details.headId,
        perspective.object.payload.remote,
        perspective.id // this perspective is set as the parent of the children's new perspectives
      );
    }

    await this.newPerspective({
      perspective,
      update: { perspectiveId: perspective.id, details: { headId: forkCommitId, guardianId } },
    });

    return perspective.id;
  }

  async forkCommit(commitId: string, remote: string, parentId?: string): Promise<string> {
    const commit: Secured<Commit> = await this.client.store.getEntity(commitId);

    const dataId = commit.object.payload.dataId;
    const dataForkId = await this.forkEntity(dataId, remote, parentId);

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
    const signedCommit = signObject(newCommit);

    return this.client.store.storeEntity({ object: signedCommit, remote });
  }

  async forkEntity(entityId: string, remote: string, parentId?: string): Promise<string> {
    const data = await this.client.store.getEntity(entityId);
    if (!data) throw new Error(`data ${entityId} not found`);

    /** createOwnerPreservingEntity of children */

    const getLinksForks = this.behavior(data.object, 'children').map((link) =>
      this.fork(link, remote, parentId)
    );
    const newLinks = await Promise.all(getLinksForks);
    const newObject = this.behavior(data.object, 'replaceChildren')(newLinks);

    return this.client.store.storeEntity({ object: newObject, remote });
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
