import gql from 'graphql-tag';

export const cortexSchema = gql`
  extend type EntityContext {
    patterns: Patterns!
  }

  type Patterns {
    links: [Entity!]
  }
`;
