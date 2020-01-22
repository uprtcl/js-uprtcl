import { gql } from 'apollo-boost';

export const baseTypeDefs = gql`

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
