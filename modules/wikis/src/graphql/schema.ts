import { gql } from 'apollo-boost';
import { Wikis } from '../services/wikis';
import { WikiTypes } from 'src/types';

export const wikiTypeDefs = gql`
  type Wiki {
    title: String!
    pages: [Entity!]!
  }

  input WikiInput {
    title: String!
    pages: [ID!]!
  }

  extend union EntityType = Wiki

  extend type Mutation {
    createWiki(content: WikiInput!, usl: String): Entity!
  }
`;

export const resolvers = {
  Mutation: {
    async createWiki(_, { content, usl }, { container }) {
      const wikis: Wikis = container.get(WikiTypes.Wikis);
      const { id } = await wikis.createWiki(content, usl);
      return id;
    }
  }
};
/* 
export const wikisSchema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, wikiTypeDefs],
  resolvers: baseResolvers
});
 */
