import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const UPDATE_HEAD: DocumentNode = gql`
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

export const CREATE_PERSPECTIVE: DocumentNode = gql`
  mutation CreatePerspective(
    $creatorId: String
    $origin: String
    $timestamp: Date
    $headId: ID
    $context: String
    $name: String
    $authority: String
    $canWrite: String
    $parentId: String
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
        origin
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
