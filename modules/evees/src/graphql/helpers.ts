import { ApolloClient, gql } from "apollo-boost";

import { Commit } from '../types';
import { deriveSecured } from "src/utils/signed";
import { CASStore, loadEntity } from "@uprtcl/multiplatform";
import { CREATE_ENTITY, CREATE_PERSPECTIVE, UPDATE_HEAD } from "./queries";
import { EveesRemote } from "src/services/evees.remote";

export const getPerspectiveHead = async (client: ApolloClient<any>, perspectiveId: string): Promise<string> => {
  const result = await client.query({
    query: gql`
      {
        entity(ref: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
            }
          }
        }
      }`
  });
  return result.data.entity.payload.authority;
}

export const getPerspectiveContext = async (client: ApolloClient<any>, perspectiveId: string): Promise<string> => {
  const result = await client.query({
    query: gql`
      {
        entity(ref: "${perspectiveId}") {
          id
          ... on Perspective {
            context {
              id
            }
          }
        }
      }`
  });
  return result.data.entity.context.id;
}

export const getPerspectiveAuthority = async (client: ApolloClient<any>, perspectiveId: string): Promise<string> => {
  const result = await client.query({
    query: gql`
      {
        entity(ref: "${perspectiveId}") {
          id
          ... on Perspective {
            payload {
              authority
            }
          }
        }
      }`
  });
  return result.data.entity.payload.authority;
}

export const getPerspectiveData = async (client: ApolloClient<any>, perspectiveId: string) => {
  const result = await client.query({
    query: gql`
    {
      entity(ref: "${perspectiveId}") {
        id
        ... on Perspective {
          head {
            id 
            ... on Commit {
              data {
                id
              }
            }
          }
        }
      }
    }`
  });

  const dataId = result.data.entity.head.data.id;
  return loadEntity(client, dataId);
}

export const getCommitData = async (client: ApolloClient<any>, commitId: string) => {
  const result = await client.query({
    query: gql`
    {
      entity(ref: "${commitId}") {
        id
        ... on Commit {
          data {
            id
          }
        }
      }
    }`
  });

  const dataId = result.data.entity.data.id;
  return loadEntity(client, dataId);
}


// Creators

export const createEntity = async (client: ApolloClient<any>, store: CASStore, object: any) => {
  const create = await client.mutate({
    mutation: CREATE_ENTITY,
    variables: {
      object: object,
      casID: store.casID
    }
  });

  return create.data.createEntity.id;
}

export interface CreateCommit {
  dataId: string, 
  parentsIds?: string[], 
  creatorsIds?: string[], 
  message?: string, 
  timestamp?: number
}

export const createCommit = async (
  client: ApolloClient<any>, 
  store: CASStore,
  commit: CreateCommit) => {

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

  const commitEntity = deriveSecured(commitData, store.cidConfig);

  const create = await client.mutate({
    mutation: CREATE_ENTITY,
    variables: {
      object: commitEntity,
      casID: store.casID
    }
  });

  return create.data.createCommit.id;
}

export interface CreatePerspective {
  headId?: string,
  parentId?: string
  context?: string,
  name?: string, 
  canWrite?: string
  timestamp?: number,
  creatorId?: string
}

export const createPerspective = async (
  client: ApolloClient<any>,
  remote: EveesRemote, 
  perspective: CreatePerspective) => {

  const createPerspective = await client.mutate({
    mutation: CREATE_PERSPECTIVE,
    variables: {
      authority: remote.authority,
      casID: remote.casID,
      ...perspective
    }
  });

  return createPerspective.data.createPerspective.id;
}

export const updateHead = async (
  client: ApolloClient<any>,
  perspectiveId: string,
  headId: string) => {
  
  await client.mutate({
    mutation: UPDATE_HEAD,
    variables: {
      perspectiveId,
      headId
    }
  });

  return headId;
}
