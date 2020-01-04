import { gql } from 'apollo-boost';

import { DocumentsTypes } from '../types';
import { Documents } from '../services/documents';

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

  input TextNodeInput {
    text: String!
    type: TextType!
    links: [String!]!
  }

  extend union EntityType = TextNode

  extend type Mutation {
    createTextNode(content: TextNodeInput!, usl: ID): Entity!
  }
`;

export const resolvers = {
  Mutation: {
    async createTextNode(_, { content, usl }, { container }) {
      const documents: Documents = container.get(DocumentsTypes.Documents);

      if (!usl) {
        usl = documents.service.remote.getAllServicesUpl().find(upl => !upl.includes('http'));
      }

      const { id } = await documents.createTextNode(content, usl);
      return id;
    }
  }
};

/* 
export const documentsSchema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, documentsTypeDefs],
  resolvers: baseResolvers
});
 */
