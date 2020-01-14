import { gql } from 'apollo-boost';

export const discoveryTypeDefs = gql`
  extend type EntityContext {
    source: String!
  }
`;

export const discoveryResolvers = {
  EntityContext: {
    source(parent, _, { cache }) {}
  }
};
