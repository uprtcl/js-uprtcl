import gql from 'graphql-tag';

export const typeDefs = gql`
  enum TextType {
    Title,
    Paragraph
  }

  type TextNode {
    text: String!
    type: TextType
    links: [Entity]!
  }

  extend union EntityType = TextNode
`;
