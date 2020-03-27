import gql from 'graphql-tag';

export const mockSchema = gql`
  type Mock implements Entity {
    id: ID!
    mockField: String
    _context: EntityContext!
  }
`;
