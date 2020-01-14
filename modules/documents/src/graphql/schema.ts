import { gql } from 'apollo-boost';

import { DocumentsTypes } from '../types';
import { Documents } from '../services/documents';
import { Logger } from '@uprtcl/micro-orchestrator';

const logger = new Logger('DECUMENT-TEXT-NODE-SCHEMA');

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
    links: [Entity]!

    _patterns: Patterns!
    _meta: Metadata!
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

export const resolvers = {
  Mutation: {
    async createTextNode(_, { content, usl }, { container }) {
      logger.info('createTextNode()', { content, usl })

      const documents: Documents = container.get(DocumentsTypes.Documents);

      const textNode = await documents.createTextNode(content, usl);
      return { id: textNode.id, ...textNode.object };
    }
  }
};

/* 
export const documentsSchema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, documentsTypeDefs],
  resolvers: baseResolvers
});
 */
