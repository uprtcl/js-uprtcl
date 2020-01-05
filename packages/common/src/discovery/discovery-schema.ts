import { gql } from 'apollo-boost';

export const discoveryTypeDefs = gql`
  extend type Metadata {
    source: String!
  }
`;

export const discoveryResolvers = {
  Metadata: {
    source(parent, _, { cache }) {}
  }
};
