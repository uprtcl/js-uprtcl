import gql from 'graphql-tag';

export const mockSchema = gql`
  type Mock implements Entity {
    id: ID!
    test: String
    _context: EntityContext!
  }

  extend type Patterns {
    text: String
  }
`;
