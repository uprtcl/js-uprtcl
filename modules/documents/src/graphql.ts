import gql from 'graphql-tag';
import { makeExecutableSchema } from 'graphql-tools';

import { baseTypeDefs, baseResolvers } from '@uprtcl/common';

export const documentsTypeDefs = gql`
  enum TextType {
    Title
    Paragraph
  }

  type TextNode implements EntityType {
    text: String!
    type: TextType!
    links: [Entity]!
    
    patterns: Patterns!
  }
`;

export const documentsSchema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, documentsTypeDefs],
  resolvers: baseResolvers
});
