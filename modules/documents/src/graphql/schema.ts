import { gql } from 'apollo-boost';

export const documentsTypeDefs = gql`
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

    _patterns: Patterns!
  }

  input TextNodeInput {
    text: String!
    type: TextType!
    links: [String!]!
  }

  extend type Mutation {
    createTextNode(content: TextNodeInput!, usl: ID): TextNode!
  }
`;