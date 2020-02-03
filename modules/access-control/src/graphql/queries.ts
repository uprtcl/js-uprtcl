import gql from 'graphql-tag';

export const CHANGE_OWNER = gql`
  mutation ChangeOwner($entityId: ID!, $newOwner: ID!) {
    changeOwner(entityId: $entityId, newOwner: $newOwner) {
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
