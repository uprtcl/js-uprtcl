import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const cortexSchema: DocumentNode = gql`
  scalar JSON

  interface Entity {
    id: ID!

    _context: EntityContext!
  }

  type EntityContext {
    patterns: Patterns!
    object: JSON!
  }

  type Patterns {
    links: [Entity!] @discover
  }
`;
