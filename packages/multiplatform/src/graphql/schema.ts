import { gql } from 'apollo-boost';
import { DocumentNode } from 'graphql';

export const discoveryTypeDefs: DocumentNode = gql`
  extend type EntityContext {
    source: String!
  }

  directive @discover on FIELD_DEFINITION
  directive @source(source: String!) on FIELD_DEFINITION

  extend type Query {
    entity(id: ID!): Entity! @discover
  }

  extend type Patterns {
    content: Entity! @discover
    isomorphisms: [Entity!]! @discover
  }
`;
