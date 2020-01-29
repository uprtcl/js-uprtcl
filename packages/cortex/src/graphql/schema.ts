import gql from 'graphql-tag';

export const cortexSchema = gql`
  scalar JSON

  extend type EntityContext {
    patterns: Patterns!
    raw: String!
  }

  type Patterns {
    links: [Entity!] @discover
  }
`;
