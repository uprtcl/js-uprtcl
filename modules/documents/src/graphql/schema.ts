import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const documentsTypeDefs: DocumentNode = gql`
  extend type Patterns {
    title: String
  }

  enum TextType {
    Title
    Paragraph
  }

  type TextNode implements Entity {
    id: ID!

    text: String!
    type: TextType!
    links: [Entity]! @discover

    _context: EntityContext!
  }
`;
