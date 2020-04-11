import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const UPDATE_HEAD: DocumentNode = gql`
  mutation UpdatePerspectiveHead($perspectiveId: ID!, $headId: ID, $context: String, $name: String) {
    updatePerspectiveHead(perspectiveId: $perspectiveId, headId: $headId, context: $context, name: $name) {
      id
      head {
        id
        data {
          id
        }
      }
      context {
        id
      }
      name
      payload {
        authority
      }
      _context {
        patterns {
          content {
            id
          }
        }
      }
    }
  }
`;

export const DELETE_PERSPECTIVE: DocumentNode = gql`
  mutation DeletePerspective($perspectiveId: ID!) {
    deletePerspective(perspectiveId: $perspectiveId) {
      id
    }
  }
`;

export const CREATE_COMMIT: DocumentNode = gql`
  mutation CreateCommit(
    $dataId: ID!
    $parentsIds: [ID!]!
    $creatorsIds: [String]
    $message: String
    $source: String!
    $timestamp: Date
  ) {
    createCommit(
      dataId: $dataId
      parentsIds: $parentsIds
      creatorsIds: $creatorsIds
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

export const CREATE_PERSPECTIVE: DocumentNode = gql`
  mutation CreatePerspective(
    $authority: String
    $creatorId: String
    $timestamp: Date
    $headId: ID
    $context: String
    $name: String
    $canWrite: String
    $parentId: String
  ) {
    createPerspective(
      authority: $authority
      creatorId: $creatorId
      timestamp: $timestamp
      headId: $headId
      context: $context
      name: $name
      canWrite: $canWrite
      parentId: $parentId
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
        authority
        timestamp
      }
    }
  }
`;

export const CREATE_PROPOSAL: DocumentNode = gql`
  mutation AddProposal(
    $toPerspectiveId: ID!
    $fromPerspectiveId: ID!
    $updateRequests: [HeadUpdateInput!]
  ) {
    addProposal(
      toPerspectiveId: $toPerspectiveId
      fromPerspectiveId: $fromPerspectiveId
      updateRequests: $updateRequests
    ) {
      id
      toPerspective {
        id
        proposals {
          id
        }
      }
      fromPerspective {
        id
      }
      updates
      authorized
      canAuthorize
      executed
    }
  }
`;

export const AUTHORIZE_PROPOSAL: DocumentNode = gql`
  mutation AuthorizeProposal($proposalId: ID!, $perspectiveId: ID!, $authorize: Boolean!) {
    authorizeProposal(
      proposalId: $proposalId
      perspectiveId: $perspectiveId
      authorize: $authorize
    ) {
      id
      authorized
    }
  }
`;

export const EXECUTE_PROPOSAL: DocumentNode = gql`
  mutation ExecuteProposal($proposalId: ID!, $perspectiveId: ID!) {
    executeProposal(proposalId: $proposalId, perspectiveId: $perspectiveId) {
      id
      toPerspective {
        id
        head {
          id
          data {
            id
          }
        }
      }
      executed
    }
  }
`;
