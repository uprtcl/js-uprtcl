import { gql } from 'apollo-boost';
import { delegateToSchema, makeExecutableSchema } from 'graphql-tools';

import { Secured, GraphQlTypes, baseTypeDefs, baseResolvers } from '@uprtcl/common';

import { Commit } from './types';

export const eveesTypeDefs = gql`
  type Commit {
    parentCommits: [Entity!]!
    message: String
    data: Entity
  }

  type Perspective {
    head: Entity
    name: String
    context: String
  }

  extend union EntityType = Commit | Perspective
`;

export const eveesResolvers = {
  Commit: {
    message(parent: Secured<Commit>, args, context, info) {
      return parent.object.payload.message;
    },
    parentCommits(parent: Secured<Commit>, args, context, info) {
      const schema = context.get(GraphQlTypes.RootSchema);

      return parent.object.payload.parentsIds.map(parentId =>
        delegateToSchema({
          schema,
          operation: 'query',
          fieldName: 'getEntity',
          args: { ...args, id: parentId },
          context,
          info
        })
      );
    }
  }
};

export const eveesSchema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, eveesTypeDefs],
  resolvers: {
    ...baseResolvers,
    ...eveesResolvers
  }
});
