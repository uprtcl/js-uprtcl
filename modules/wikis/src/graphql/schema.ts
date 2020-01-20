import { gql } from 'apollo-boost';

export const wikiTypeDefs = gql`
  type Wiki implements Entity {
    id: ID!

    title: String!
    pages: [Entity!]! @discover

    _context: EntityContext!
  }

  input WikiInput {
    title: String!
    pages: [ID!]!
  }

  extend type Mutation {
    createWiki(content: WikiInput!, source: String): Wiki!
  }
`;

/* 
export const wikisSchema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, wikiTypeDefs],
  resolvers: baseResolvers
});
 */
