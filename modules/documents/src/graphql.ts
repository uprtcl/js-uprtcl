import { gql } from 'apollo-boost';

export const documentsTypeDefs = gql`
  extend type Patterns {
    title: String
  }

  enum TextType {
    Title
    Paragraph
  }

  type TextNode {
    text: String!
    type: TextType!
    links: [Entity]!
  }

  extend union EntityType = TextNode
`;
/* 
export const documentsSchema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, documentsTypeDefs],
  resolvers: baseResolvers
});
 */
