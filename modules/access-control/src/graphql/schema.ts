import gql from 'graphql-tag';

export const accessControlTypes = gql`
  extend type Patterns {
    accessControl: AccessControl
  }

  extend type Mutation {
    setCanWrite(entityId: ID!, userId: ID!): Entity! @discover
  }

  type AccessControl {
    canWrite: Boolean!
    permissions: JSON!
  }
`;
