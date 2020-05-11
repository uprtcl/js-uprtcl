import { gql } from 'apollo-boost';
import { DocumentNode } from 'graphql';

export const UPDATE_HEAD: DocumentNode = gql`
  mutation UpdatePerspectiveHead(
    $perspectiveId: ID!
    $headId: ID
    $context: String
    $name: String
  ) {
    updatePerspectiveHead(
      perspectiveId: $perspectiveId
      headId: $headId
      context: $context
      name: $name
    ) {
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
        content {
          id
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

export const CREATE_ENTITY: DocumentNode = gql`
  mutation CreateEntity($object: JSON!, $casID: ID) {
    createEntity(object: $object, casID: $casID) {
      id
    }
  }
`;

export const CREATE_PERSPECTIVE: DocumentNode = gql`
  mutation CreatePerspective(
    $authority: String!
    $creatorId: String
    $timestamp: Date
    $headId: ID
    $context: String!
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

export const CREATE_AND_ADD_PROPOSAL: DocumentNode = gql`
  mutation CreateAndAddProposal($perspectives: [NewPerspectiveInput]!, $proposal: ProposalInput!) {
    createAndAddProposal(perspectives: $perspectives, proposal: $proposal) {
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

export const CREATE_PROPOSAL: DocumentNode = gql`
  mutation AddProposal(
    $toPerspectiveId: ID!
    $fromPerspectiveId: ID!
    $toHeadId: ID!
    $fromHeadId: ID!
    $updateRequests: [HeadUpdateInput!]
  ) {
    addProposal(
      toPerspectiveId: $toPerspectiveId
      fromPerspectiveId: $fromPerspectiveId
      toHeadId: $toHeadId
      fromHeadId: $fromHeadId
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
      executed
      toPerspective {
        id
        head {
          id
          data {
            id
          }
        }
      }
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
