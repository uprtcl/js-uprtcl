import { ApolloClient, gql } from 'apollo-boost';
import { cloneDeep } from 'lodash-es';

import { CASStore, loadEntity } from '@uprtcl/multiplatform';
import { Signed, Entity, PatternRecognizer, HasChildren } from '@uprtcl/cortex';

import { CREATE_ENTITY, CREATE_PERSPECTIVE, UPDATE_HEAD } from './queries';
import { EveesRemote } from '../services/evees.remote';
import { Commit, EveesConfig, Perspective } from '../types';
import { deriveSecured, signObject } from '../utils/signed';
import { EveesBindings } from '../bindings';
import { hashObject, Secured } from '../utils/cid-hash';

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
  canWrite?: string;
  timestamp?: number;
  creatorId?: string;
}

export class EveesHelpers {
  static async getPerspectiveHeadId(
    client: ApolloClient<any>,
    perspectiveId: string
  ): Promise<string | undefined> {
    if (!perspectiveId) throw new Error('PerspectiveId undefined');

    const result = await client.query({
      query: gql`
        {
          entity(uref: "${perspectiveId}") {
            id
            ... on Perspective {
              head {
                id
              }
            }
          }
        }`
    });
    if (result.data.entity.head === undefined || result.data.entity.head == null) return undefined;
    return result.data.entity.head.id;
  }

  static async canWrite(client: ApolloClient<any>, perspectiveId: string): Promise<boolean> {
    const result = await client.query({
      query: gql`
        {
          entity(uref: "${perspectiveId}") {
            id
            ... on Perspective {
              canWrite
            }
          }
        }`
    });
    if (result.data.entity.canWrite === undefined || result.data.entity.canWrite == null)
      return false;
    return result.data.entity.canWrite;
  }

  static async getPerspectiveRemoteId(
    client: ApolloClient<any>,
    perspectiveId: string
  ): Promise<string> {
    const perspective = await loadEntity<Signed<Perspective>>(client, perspectiveId);
    if (!perspective) throw new Error('perspective not found');
    return perspective.object.payload.remote;
  }

  static async getPerspectiveDataId(
    client: ApolloClient<any>,
    perspectiveId: string
  ): Promise<string | undefined> {
    const headId = await this.getPerspectiveHeadId(client, perspectiveId);
    if (headId === undefined) return undefined;
    return this.getCommitDataId(client, headId);
  }

  static async getPerspectiveData(
    client: ApolloClient<any>,
    perspectiveId: string
  ): Promise<Entity<any> | undefined> {
    const headId = await this.getPerspectiveHeadId(client, perspectiveId);
    if (headId === undefined) return undefined;
    return this.getCommitData(client, headId);
  }

  static async getCommitData(client: ApolloClient<any>, commitId: string): Promise<Entity<any>> {
    const dataId = await this.getCommitDataId(client, commitId);
    const data = await loadEntity<any>(client, dataId);
    if (!data) throw new Error('data not found');
    /** make sure users of loadEntity wont mess the cache by reference */
    return cloneDeep(data);
  }

  static async getCommitDataId(client: ApolloClient<any>, commitId: string): Promise<string> {
    const commit = await loadEntity<Signed<Commit>>(client, commitId);
    if (!commit) throw new Error('commit not found');
    return commit.object.payload.dataId;
  }

  static async getData(client: ApolloClient<any>, recognizer: PatternRecognizer, uref: string) {
    const entity = await loadEntity<any>(client, uref);
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
    client: ApolloClient<any>,
    recognizer: PatternRecognizer,
    uref: string
  ): Promise<string[]> {
    const data = await this.getData(client, recognizer, uref);

    const hasChildren: HasChildren = recognizer
      .recognizeBehaviours(data)
      .find(b => (b as HasChildren).getChildrenLinks);

    return hasChildren.getChildrenLinks(data);
  }

  static async getDescendantsRec(
    client: ApolloClient<any>,
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
    client: ApolloClient<any>,
    recognizer: PatternRecognizer,
    uref: string
  ): Promise<string[]> {
    return this.getDescendantsRec(client, recognizer, uref, []);
  }

  // Creators
  static async createEntity(client: ApolloClient<any>, store: CASStore, object: any) {
    const create = await client.mutate({
      mutation: CREATE_ENTITY,
      variables: {
        object: object,
        casID: store.casID
      }
    });

    return create.data.createEntity.id;
  }

  static async createCommit(client: ApolloClient<any>, store: CASStore, commit: CreateCommit) {
    const message = commit.message !== undefined ? commit.message : '';
    const timestamp = commit.timestamp !== undefined ? commit.timestamp : Date.now();
    const creatorsIds = commit.creatorsIds !== undefined ? commit.creatorsIds : [];
    const parentsIds = commit.parentsIds !== undefined ? commit.parentsIds : [];

    const commitData: Commit = {
      creatorsIds: creatorsIds,
      dataId: commit.dataId,
      message: message,
      timestamp: timestamp,
      parentsIds: parentsIds
    };

    const commitObject = signObject(commitData);

    const create = await client.mutate({
      mutation: CREATE_ENTITY,
      variables: {
        object: commitObject,
        casID: store.casID
      }
    });

    return create.data.createEntity.id;
  }

  static async createPerspective(
    client: ApolloClient<any>,
    remote: EveesRemote,
    perspective: CreatePerspective
  ) {
    const createPerspective = await client.mutate({
      mutation: CREATE_PERSPECTIVE,
      variables: {
        remote: remote.id,
        casID: remote.store.casID,
        ...perspective
      }
    });

    return createPerspective.data.createPerspective.id;
  }

  static async updateHead(client: ApolloClient<any>, perspectiveId: string, headId: string) {
    await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId,
        headId
      }
    });

    return headId;
  }

  static async isAncestorCommit(
    client: ApolloClient<any>,
    perspectiveId: string,
    commitId: string,
    stopAt?: string
  ) {
    const headId = await this.getPerspectiveHeadId(client, perspectiveId);
    if (headId === undefined) return false;
    const findAncestor = new FindAncestor(client, commitId, stopAt);
    return findAncestor.checkIfParent(headId);
  }

  static async checkEmit(
    config: EveesConfig,
    client: ApolloClient<any>,
    eveesRemotes: EveesRemote[],
    perspectiveId: string
  ): Promise<boolean> {
    if (config.emitIf === undefined) return false;

    const remoteId = await EveesHelpers.getPerspectiveRemoteId(client, perspectiveId);
    const toRemote = eveesRemotes.find(r => r.id === remoteId);
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
    timestamp = timestamp ? timestamp : Date.now();

    const defaultContext = await hashObject({
      creatorId,
      timestamp
    });

    context = context || defaultContext;

    const object: Perspective = {
      creatorId,
      remote: remote.id,
      path: path !== undefined ? path : remote.defaultPath,
      timestamp,
      context
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
      path: '',
      creatorId,
      timestamp: 0,
      context: `${creatorId}.home`
    };

    return deriveSecured(remoteHome, remote.store.cidConfig);
  }
}

export class FindAncestor {
  done: boolean = false;

  constructor(
    protected client: ApolloClient<any>,
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

    const commit = await loadEntity<Signed<Commit>>(this.client, commitId);
    if (!commit) throw new Error(`commit ${commitId} not found`);

    if (commit.object.payload.parentsIds.length === 0) {
      return false;
    }

    const seeParents = await Promise.all(
      commit.object.payload.parentsIds.map(parentId => {
        /* recursively look on parents */
        return this.checkIfParent(parentId);
      })
    );

    return seeParents.includes(true);
  }
}
