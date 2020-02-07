import gql from 'graphql-tag';

export const SET_CAN_WRITE = gql`
  mutation setCanWrite($entityId: ID!, $userId: ID!) {
    setCanWrite(entityId: $entityId, userId: $userId) {
      id
      _context {
        patterns {
          accessControl {
            canWrite
            permissions
          }
        }
      }
    }
  }
`;
