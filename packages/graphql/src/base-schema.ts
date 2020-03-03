import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const baseTypeDefs: DocumentNode = gql`

  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }

  interface Entity {
    id: ID!

    _context: EntityContext!
  }

  type EntityContext {
    _: Boolean
  }
`;
