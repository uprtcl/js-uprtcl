import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const accessControlTypes: DocumentNode = gql`
  extend type Patterns {
    accessControl: AccessControl
  }

  extend type Mutation {
    setCanWrite(entityId: ID!, userId: ID!): Entity! @discover
    setPublicRead(entityId: ID!, value: Boolean): Entity! @discover
  }

  type AccessControl {
    canWrite: Boolean!
    permissions: JSON!
  }
`;
