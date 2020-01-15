import { gql } from 'apollo-boost';

export const discoveryTypeDefs = gql`
  extend type EntityContext {
    source: String!
  }

  directive @discover on FIELD_DEFINITION

  extend type Quer {
    entity(id: ID!): Entity! @discover
  }
`;

export const discoveryResolvers = {
  EntityContext: {
    source(parent, _, { cache }) {}
  }
};
