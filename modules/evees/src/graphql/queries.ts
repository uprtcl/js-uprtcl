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
  mutation CreateCommit($dataId: ID!, $parentsIds: [ID!]!, $message: String, $source: String) {
    createCommit(dataId: $dataId, parentsIds: $parentsIds, message: $message, source: $source) {
      id
      data {
        id
      }
      message
    }
  }
`;

export const CREATE_PERSPECTIVE = gql`
  mutation CreatePerspective($headId: ID, $context: String, $name: String, $authority: String) {
    createPerspective(headId: $headId, context: $context, name: $name, authority: $authority) {
      id
      name
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
