import { CASOnMemory } from '../cas/stores/cas.memory';
import { signObject } from '../cas/utils/signed';
import { Secured } from '../cas/utils/cid-hash';
import { CASRemote } from '../cas/interfaces/cas-remote';
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
  EveesMutation,
  UpdateDetails,
  UpdatePerspectiveData,
} from './interfaces/types';
import { Entity } from '../cas/interfaces/entity';
import { HasChildren, LinkingBehaviorNames } from '../patterns/behaviours/has-links';
import { Signed } from '../patterns/interfaces/signable';
import { ErrorWithCode } from '../utils/error';
import { PatternRecognizer } from '../patterns/recognizer/pattern-recognizer';
import { RemoteEvees } from './interfaces/remote.evees';
import { getHome } from './default.perspectives';
import { ClientOnMemory } from './clients/memory/client.memory';
import { arrayDiff } from './merge/utils';

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

export const BEHAVIOUR_NOT_FOUND_ERROR = 'BehaviorNotFound';

export class Evees {
  constructor(
    readonly client: Client,
    readonly recognizer: PatternRecognizer,
    readonly remotes: RemoteEvees[],
    readonly stores: CASRemote[],
    readonly config: EveesConfig,
    readonly modules: Map<string, EveesContentModule>
  ) {}

  /** Clone a new Evees service using another client that keeps the client of the curren service as it's based
   * client. Useful to create temporary workspaces to compute differences and merges without affecting the app client. */
  async clone(
    name: string = 'NewClient',
    client?: Client,
    mutation?: EveesMutation
  ): Promise<Evees> {
    const store = client ? client.store : new CASOnMemory(this.client.store);
    client = client || new ClientOnMemory(this.client, store, name);

    if (mutation) {
      await client.update(mutation);
    }

    return new Evees(client, this.recognizer, this.remotes, this.stores, this.config, this.modules);
  }

  findRemote<T extends RemoteEvees>(query: string): T {
    const remote = this.remotes.find((r) => r.id.includes(query));
    if (!remote) throw new Error(`remote starting with ${query} not found`);
    return remote as T;
  }

  getRemote<T extends RemoteEvees>(remoteId?: string): T {
    if (remoteId) {
      const remote = this.remotes.find((r) => r.id === remoteId);
      if (!remote) throw new Error(`remote ${remoteId} not found`);
      return remote as T;
    } else {
      return this.remotes[0] as T;
    }
  }

  getCASRemote<T extends CASRemote>(casID: string): T {
    const store = this.stores.find((r) => r.casID === casID);
    if (!store) throw new Error(`store ${store} not found`);
    return store as T;
  }

  async getPerspectiveRemote<T extends RemoteEvees>(perspectiveId: string): Promise<T> {
    const perspective = await this.client.store.getEntity(perspectiveId);
    if (!perspective) throw new Error('perspective not found');
    const remoteId = perspective.object.payload.remote;
    return this.getRemote<T>(remoteId);
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

  async tryGetPerspectiveData<T = any>(perspectiveId: string): Promise<Entity | undefined> {
    const result = await this.client.getPerspective(perspectiveId);
    return result.details.headId ? this.getCommitData<T>(result.details.headId) : undefined;
  }

  async tryGetCommitData<T = any>(commitId: string | undefined): Promise<Entity | undefined> {
    if (commitId === undefined) return commitId;
    const dataId = await this.tryGetCommitDataId(commitId);
    if (!dataId) return undefined;

    const data = await this.client.store.getEntity<T>(dataId);
    return data;
  }

  async getCommitData<T = any>(commitId: string): Promise<Entity> {
    const dataId = await this.getCommitDataId(commitId);
    const data = await this.client.store.getEntity<T>(dataId);
    return data;
  }

  async tryGetCommitDataId(commitId: string | undefined): Promise<string | undefined> {
    if (commitId === undefined) return commitId;
    const commit = await this.client.store.getEntity(commitId);
    return commit ? commit.object.payload.dataId : undefined;
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

  private behavior(object: object, behaviorName: string): Array<any> {
    const allBehaviors = this.recognizer.recognizeBehaviours(object);
    const thisBehaviors = allBehaviors.filter((b) => b[behaviorName]);

    if (!allBehaviors.length) {
      throw new ErrorWithCode(
        `No behaviors found for object ${JSON.stringify(object)}`,
        BEHAVIOUR_NOT_FOUND_ERROR
      );
    }
    if (thisBehaviors.length === 0) {
      throw new ErrorWithCode(
        `Behavior ${behaviorName} not found for object ${JSON.stringify(object)}`,
        BEHAVIOUR_NOT_FOUND_ERROR
      );
    }

    return thisBehaviors.map((behavior) => {
      return behavior[behaviorName](object);
    });
  }

  async perspectiveBehaviorFirst(uref: string, behavior: string) {
    const data = await this.getPerspectiveData(uref);
    return this.behaviorFirst(data.object, behavior);
  }

  private hasBehavior(object: object, behaviorName: string) {
    try {
      this.behavior(object, behaviorName);
    } catch (e) {
      if (e.code === BEHAVIOUR_NOT_FOUND_ERROR) {
        return false;
      } else {
        throw new Error(e.msg);
      }
    }
    return true;
  }

  /** returns the first beheavior matched by the object, ignoring
   * other possible matches */
  behaviorFirst<T = any>(object: object, behaviorName: string) {
    const allBehaviors = this.behavior(object, behaviorName);
    return allBehaviors[0];
  }

  /** concatenate the results of behaviors matched by this object,
   * assuming each match will be an array of elements,
   * and remove duplicates */
  behaviorConcat<T = any>(object: object, behaviorName: string): Array<T> {
    const allBehaviors = this.behavior(object, behaviorName);
    const uniqueMatches = new Set<any>();

    allBehaviors.forEach((matched) => {
      matched.forEach((match) => {
        uniqueMatches.add(match);
      });
    });

    return [...uniqueMatches];
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

  async checkText(update: Update): Promise<Update> {
    const hasData = update.details.headId;

    if (hasData) {
      const data = await this.getCommitData(update.details.headId as string);
      const has = this.hasBehavior(data.object, 'text');

      if (has) {
        update.text = this.behaviorFirst(data.object, 'text');
      }
    }

    return update;
  }

  /** A helper methods that processes an update and appends the links */
  async checkLinks(update: Update, patternName = 'children'): Promise<Update> {
    const hasData = update.details.headId;

    if (hasData) {
      const data = await this.getCommitData(update.details.headId as string);
      const has = this.hasBehavior(data.object, patternName);

      if (has) {
        const children = this.behaviorConcat(data.object, patternName);

        let oldChildren: string[] = [];

        if (update.oldDetails && update.oldDetails.headId) {
          const oldData = await this.getCommitData(update.oldDetails.headId);

          const oldHas = this.hasBehavior(oldData.object, patternName);
          oldChildren = oldHas ? this.behaviorConcat(oldData.object, patternName) : [];
        }

        const { added, removed } = arrayDiff(oldChildren, children);

        /** set the details */
        update.linkChanges = {
          ...update.linkChanges,
          [patternName]: {
            added,
            removed,
          },
        };
      }
    }

    return update;
  }

  async prepareUpdate(update: Update) {
    return update;
  }

  /** process the update and automatically append indexing data (children, links, and text) based on the new value */
  async appendIndexing(update) {
    update = await this.checkLinks(update, 'children');
    update = await this.checkLinks(update, 'linksTo');
    update = await this.checkText(update);
    return update;
  }

  /** A helper method that injects the added and remvoed children to a newPerspective object and send it to the client */
  async newPerspective(newPerspective: NewPerspective) {
    newPerspective.update = await this.appendIndexing(newPerspective.update);
    return this.client.newPerspective(newPerspective);
  }

  /** A helper method that injects the added and remvoed children to a newPerspective object and send it to the client */
  async updatePerspective(update: Update) {
    update = await this.checkOldDetails(update);
    update = await this.appendIndexing(update);
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

    if (!remoteId) {
      if (!guardianId) {
        // default remote
        remoteId = this.remotes[0].id;
      } else {
        // set the same remote as guardianId
        const guardianRemote = await this.getPerspectiveRemote(guardianId);
        remoteId = guardianRemote.id;
      }
    }

    let headId;

    if (object) {
      const dataId = await this.client.store.storeEntity({
        object,
        remote: remoteId,
      });

      const head = await this.createCommit(
        {
          dataId: dataId.id,
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

  /** A method to get the data of a perspective, and if the perspective has no data, create that data and
   * update the perspective */
  async getOrCreatePerspectiveData(
    perspectiveId: string,
    object: object = {},
    guardianId?: string
  ): Promise<Entity> {
    const data = await this.getPerspectiveData<{ proposals: string[] }>(perspectiveId);
    if (!data) {
      // initializes the home space with an empty object {}
      const perspective = await this.client.store.getEntity<Signed<Perspective>>(perspectiveId);
      await this.createEvee({
        partialPerspective: perspective.object.payload,
        object,
        guardianId,
      });
    }
    return this.getPerspectiveData(perspectiveId);
  }

  async updatePerspectiveData(options: UpdatePerspectiveData) {
    const { perspectiveId, object, amend, onHeadId: onHeadIdIn, guardianId } = options;
    let onHeadId = onHeadIdIn;

    const remote = await this.getPerspectiveRemote(perspectiveId);
    const data = await this.client.store.storeEntity({ object, remote: remote.id });

    if (!onHeadId) {
      const { details } = await this.client.getPerspective(perspectiveId);
      onHeadId = details.headId;
    }

    let parentsIds = onHeadId ? [onHeadId] : undefined;
    let removeEntities: string[] = [];

    if (amend) {
      /** amend removes the latest commit and replaces it with a new one */
      if (onHeadId) {
        const oldHead = await this.client.store.getEntity<Signed<Commit>>(onHeadId);
        parentsIds = oldHead.object.payload.parentsIds;

        /** clean the last commit entities */
        removeEntities.push(onHeadId, oldHead.object.payload.dataId);
      }
    }

    const head = await this.createCommit(
      {
        dataId: data.id,
        parentsIds,
      },
      remote.id
    );

    await this.updatePerspective({
      perspectiveId,
      details: {
        headId: head.id,
        guardianId,
      },
      linkChanges: options.linkChanges,
    });

    // clean unused entities
    await this.client.store.removeEntities(removeEntities);
  }

  async deletePerspective(uref: string): Promise<void> {
    return this.client.deletePerspective(uref);
  }

  async getPerspectiveChildren(uref: string): Promise<string[]> {
    const data = await this.tryGetPerspectiveData(uref);
    return data ? this.behaviorConcat(data.object, LinkingBehaviorNames.CHILDREN) : [];
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
    setGuardian = false
  ): Promise<void> {
    const parentData = await this.getPerspectiveData(parentId);

    const { object: newParentObject } = await this.spliceChildren(
      parentData.object,
      [childId],
      index,
      0
    );

    await this.updatePerspectiveData({ perspectiveId: parentId, object: newParentObject });

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
  async addNewChild(parentId: string, childObject: object, index = 0): Promise<string> {
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
  async movePerspective(
    fromId: string,
    childIdOrIndex: number | string,
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

  async moveChild(perspectiveId: string, fromIndex: number, toIndex: number) {
    const data = await this.getPerspectiveData(perspectiveId);

    const { removed } = await this.spliceChildren(data.object, [], fromIndex, 1);
    const result = await this.spliceChildren(data.object, removed as string[], toIndex, 0);

    await this.updatePerspectiveData({ perspectiveId, object: result.object });
    return result.removed[0];
  }

  /** get the current data of a perspective, removes the i-th child, and updates the data */
  async removeChild(perspectiveId: string, index: number): Promise<string> {
    const data = await this.getPerspectiveData(perspectiveId);
    const spliceResult = await this.spliceChildren(data.object, [], index, 1);
    await this.updatePerspectiveData({ perspectiveId, object: spliceResult.object });
    return spliceResult.removed[0];
  }

  /** removes a child and deletes it from the remote (it might might other links to it */
  async deleteChild(perspectiveId: string, index: number): Promise<string> {
    const childId = await this.removeChild(perspectiveId, index);
    await this.deletePerspective(childId);
    return childId;
  }

  async getChildId(perspectiveId: string, ix: number) {
    const data = await this.getPerspectiveData(perspectiveId);
    const children = this.behaviorConcat(data.object, 'children');
    return children[ix];
  }

  async getChildIndex(perspectiveId: string, childId: string): Promise<number> {
    const data = await this.getPerspectiveData(perspectiveId);
    const allChildren = this.behaviorConcat(data.object, 'children') as string[];
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
    return this.client.store.storeEntity({ object: commitObject, remote });
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
    guardianId?: string,
    recurse: boolean = true
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
        perspective.id, // this perspective is set as the parent of the children's new perspectives
        recurse
      );
    }

    await this.newPerspective({
      perspective,
      update: { perspectiveId: perspective.id, details: { headId: forkCommitId, guardianId } },
    });

    return perspective.id;
  }

  async forkCommit(
    commitId: string,
    remoteId: string,
    parentId?: string,
    recurse: boolean = true
  ): Promise<string> {
    const commit: Secured<Commit> = await this.client.store.getEntity(commitId);

    const dataId = commit.object.payload.dataId;
    const dataForkId = await this.forkEntity(dataId, remoteId, parentId, recurse);

    const eveesRemote = await this.getRemote(remoteId);

    /** build new head object pointing to new data */
    const newCommit: Commit = {
      creatorsIds: eveesRemote.userId ? [eveesRemote.userId] : [''],
      dataId: dataForkId,
      message: `autocommit to fork ${commitId} on remote ${remoteId}`,
      forking: commitId,
      parentsIds: [],
      timestamp: Date.now(),
    };
    const signedCommit = signObject(newCommit);

    const entity = await this.client.store.storeEntity({ object: signedCommit, remote: remoteId });

    /** store also the linked commits and their datas if not on the target remote */
    const fromStore = this.getCASRemote(commit.casID);

    if (fromStore.isLocal) {
      const toRemote = this.getRemote(remoteId);
      await this.cloneCommitRec(commitId, toRemote.id);
    }

    return entity.id;
  }

  async cloneEntity<T = any>(id: string, onRemoteId: string): Promise<Entity<T>> {
    const onRemote = this.getRemote(onRemoteId);
    const entity = await this.client.store.getEntity<T>(id);

    if (entity.casID !== onRemote.casID) {
      // change the target remote and casId and store it again
      const storeEntity = { ...entity };

      storeEntity.casID = onRemote.casID;
      storeEntity.remote = onRemote.id;

      await this.client.store.storeEntity(storeEntity);
      return storeEntity;
    }

    return entity;
  }

  /** clone (not fork) the commit and its links if they are not in a target casID. This
   * is usefull to clone local objects on another environment that will not have access to them */
  async cloneCommitRec(commitId: string, onRemoteId: string): Promise<void> {
    const commit = await this.cloneEntity<Signed<Commit>>(commitId, onRemoteId);

    /** recursively call on commit links */
    const linkedCommits: string[] = commit.object.payload.parentsIds;

    if (commit.object.payload.forking) {
      linkedCommits.push(commit.object.payload.forking);
    }

    await this.cloneEntity(commit.object.payload.dataId, onRemoteId);

    /** recursive call on linked commits */
    await Promise.all(linkedCommits.map((link) => this.cloneCommitRec(link, onRemoteId)));
  }

  async forkEntity(
    entityId: string,
    remoteId: string,
    parentId?: string,
    recurse: boolean = true
  ): Promise<string> {
    if (recurse) {
      const data = await this.client.store.getEntity(entityId);
      if (!data) throw new Error(`data ${entityId} not found`);

      /** createOwnerPreservingEntity of children */
      const getLinksForks = this.behaviorConcat(data.object, 'children').map((link) =>
        this.fork(link, remoteId, parentId)
      );
      const newLinks = await Promise.all(getLinksForks);
      // TODO how can replace children when matching multiple patterns?
      const newObject = this.behaviorFirst(data.object, 'replaceChildren')(newLinks);

      const entity = await this.client.store.storeEntity({ object: newObject, remote: remoteId });
      return entity.id;
    } else {
      return entityId;
    }
  }

  async getHome(remoteId?: string, userId?: string): Promise<Secured<Perspective>> {
    const remote = this.getRemote(remoteId);
    const home = await getHome(remote, userId ? userId : remote.userId);
    await this.client.store.storeEntity({ object: home.object, remote: remote.id });
    return home;
  }

  async exploreDiffUnder(perspectiveId: string, localEvees: Evees): Promise<UpdateDetails[]> {
    const mutation = await localEvees.client.diff();
    /** explore the root perspective and look for updates in the mutation. Store the updates in this.updatesDetails */
    return this.exploreDiffOn(perspectiveId, mutation, localEvees);
  }

  private async exploreDiffOn(
    perspectiveId: string,
    mutation: EveesMutation,
    localEvees: Evees,
    path: string[] = [],
    updateDetails: UpdateDetails[] = []
  ): Promise<UpdateDetails[]> {
    const update = mutation.updates.find((update) => update.perspectiveId === perspectiveId);

    if (update && update.details.headId) {
      const newData = await localEvees.getCommitData(update.details.headId);

      const oldData =
        update.oldDetails && update.oldDetails.headId !== undefined
          ? await localEvees.getCommitData(update.oldDetails.headId)
          : undefined;

      const updateDetail: UpdateDetails = {
        path,
        newData,
        oldData,
        update,
      };

      updateDetails.push(updateDetail);
    }

    /** recursively call on the perspective children (children are computed based on the
     * curren head, not the updated one) */
    const children = await this.getPerspectiveChildren(perspectiveId);
    for (const child of children) {
      // recursive call to explore diffs of the children
      await this.exploreDiffOn(child, mutation, localEvees, path.concat(child), updateDetails);
    }

    return updateDetails;
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
