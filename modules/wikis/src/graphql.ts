import gql from 'graphql-tag';
import { makeExecutableSchema } from 'graphql-tools';

import { baseTypeDefs, baseResolvers } from '@uprtcl/common';

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