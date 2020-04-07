import { gql } from 'apollo-boost';
import { DocumentNode } from 'graphql';

export const discoveryTypeDefs: DocumentNode = gql`
  extend type EntityContext {
    casID: String!
  }

  directive @discover on FIELD_DEFINITION
  directive @source(casID: String!) on FIELD_DEFINITION

  extend type Query {
    entity(link: ID!): Entity! @discover
  }
`;
