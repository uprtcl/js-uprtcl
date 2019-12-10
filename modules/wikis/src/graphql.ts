import gql from 'graphql-tag';
import { makeExecutableSchema } from 'graphql-tools';

import { baseTypeDefs, baseResolvers } from '@uprtcl/common';

export const wikiTypeDefs = gql`  
  type Wiki implements EntityType {
    title: String!
    pages: [Entity]!

    patterns: Patterns!
  }
`;

export const wikisSchema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, wikiTypeDefs],
  resolvers: baseResolvers
});
