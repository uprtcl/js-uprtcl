import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const SET_CAN_WRITE: DocumentNode = gql`
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

export const SET_PUBLIC_READ = gql`
  mutation setPublicRead($entityId: ID!, $value: Boolean!) {
    setPublicRead(entityId: $entityId, value: $value) {
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
