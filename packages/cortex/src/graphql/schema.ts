import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const cortexSchema: DocumentNode = gql`
  scalar JSON

  extend type EntityContext {
    patterns: Patterns!
    object: JSON!
  }

  type Patterns {
    links: [Entity!] @discover
  }
`;
