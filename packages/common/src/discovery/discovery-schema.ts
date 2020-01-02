import { gql } from 'apollo-boost';

export const discoveryTypeDefs = gql`
  extend type Entity {
    source: ID!
  }
`;

export const discoveryResolvers = {
  Entity: {
    source(parent, _, { cache }) {}
  }
};
