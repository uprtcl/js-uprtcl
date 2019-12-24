import gql from 'graphql-tag';

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