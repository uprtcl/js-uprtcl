import { ApolloClient, gql } from 'apollo-boost';
import { cloneDeep } from 'lodash-es';

import { CASStore, loadEntity } from '@uprtcl/multiplatform';
import { Signed, Entity, PatternRecognizer, HasChildren } from '@uprtcl/cortex';

import { CREATE_ENTITY, CREATE_PERSPECTIVE, UPDATE_HEAD } from './queries';
import { EveesRemote } from '../services/evees.remote';
import { Commit, Perspective } from '../types';
import { signObject } from '../utils/signed';
import { EveesBindings } from '../bindings';

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

  static async getPerspectiveContext(
    client: ApolloClient<any>,
    perspectiveId: string
  ): Promise<string | undefined> {
    const result = await client.query({
      query: gql`
        {
          entity(uref: "${perspectiveId}") {
            id
            ... on Perspective {
              context {
                id
              }
            }
          }
        }`
    });
    if (result.data.entity.context === undefined) return undefined;
    return result.data.entity.context.id;
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

    const commitEntity = signObject(commitData);

    const create = await client.mutate({
      mutation: CREATE_ENTITY,
      variables: {
        object: commitEntity,
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
}
