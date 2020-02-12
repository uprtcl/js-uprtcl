import { gql } from 'apollo-boost';

export const UPDATE_HEAD = gql`
  mutation UpdatePerspectiveHead($perspectiveId: ID!, $headId: ID!) {
    updatePerspectiveHead(perspectiveId: $perspectiveId, headId: $headId) {
      id
      head {
        id
        data {
          id
        }
      }
      payload {
        origin
      }
    }
  }
`;

export const CREATE_COMMIT = gql`
  mutation CreateCommit(
    $creatorsIds: [String]
    $dataId: ID!
    $parentsIds: [ID!]!
    $message: String
    $source: String
    $timestamp: Date
  ) {
    createCommit(
      creatorsIds: $creatorsIds
      dataId: $dataId
      parentsIds: $parentsIds
      message: $message
      source: $source
      timestamp: $timestamp
    ) {
      id
      creatorsIds
      data {
        id
      }
      parentCommits {
        id
      }
      message
      timestamp
    }
  }
`;

export const CREATE_PERSPECTIVE = gql`
  mutation CreatePerspective(
    $creatorId: String
    $origin: String
    $timestamp: Date
    $headId: ID
    $context: String
    $name: String
    $authority: String
    $canWrite: String
  ) {
    createPerspective(
      creatorId: $creatorId
      origin: $origin
      timestamp: $timestamp
      headId: $headId
      context: $context
      name: $name
      authority: $authority
      canWrite: $canWrite
    ) {
      id
      name
      head {
        id
        data {
          id
        }
      }
      payload {
        creatorId
        origin
        timestamp
      }
    }
  }
`;
