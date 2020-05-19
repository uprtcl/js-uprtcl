import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const wikiTypeDefs: DocumentNode = gql`
  type Wiki implements Entity {
    id: ID!

    title: String!
    pages: [Entity!]! @discover

    _context: EntityContext!
  }
`;
