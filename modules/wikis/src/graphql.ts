import { gql } from 'apollo-boost';

export const wikiTypeDefs = gql`
  type Wiki {
    title: String!
    pages: [Entity!]!
  }

  extend union EntityType = Wiki
`;
/* 
export const wikisSchema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, wikiTypeDefs],
  resolvers: baseResolvers
});
 */
