import { gql, ApolloClient, InMemoryCache } from 'apollo-boost';
import {
  IGraphQLToolsResolveInfo,
  mergeSchemas,
  IDelegateToSchemaOptions,
  MergeInfo,
  makeExecutableSchema,
  delegateToSchema
} from 'graphql-tools';
import { GraphQLSchema, GraphQLResolveInfo } from 'graphql';

import { GraphQlTypes } from '@uprtcl/micro-orchestrator';

import { DiscoveryTypes, PatternTypes } from '../types';
import { DiscoveryService } from '../services/discovery.service';
import { PatternRecognizer } from './recognizer/pattern.recognizer';
import { Hashed } from './properties/hashable';
import { HasRedirect } from './properties/has-redirect';
import { Pattern } from './pattern';
import { IsEntity } from './properties/is-entity';

export const cortexTypeDefs = gql`
  scalar JSON

  type EmptyEntity {
    _: Boolean
  }

  union EntityType = EmptyEntity

  type Query {
    getEntity(id: ID!, depth: Int = 1, disableRedirect: Boolean = false): Entity!
  }

  type Entity {
    id: ID!
    raw: JSON!
    entity: EntityType!
    patterns: Patterns!
  }

  type Patterns {
    links: [Entity!]
  }
`;

export const resolvers = {
  Query: {
    async getEntity(parent, args, context, info: IGraphQLToolsResolveInfo) {
      const discoveryService: DiscoveryService = context.get(DiscoveryTypes.DiscoveryService);
      const recognizer: PatternRecognizer = context.get(PatternTypes.Recognizer);

      const entity: Hashed<any> | undefined = await discoveryService.get(args.id);

      if (!entity) throw new Error('Entity was not found');

      const patterns: Pattern | HasRedirect = recognizer.recognizeMerge(entity);

      if (!args.disableRedirect && (patterns as HasRedirect).redirect) {
        const redirectEntityId = await (patterns as HasRedirect).redirect(entity);

        const rootSchema: GraphQLSchema = context.get(GraphQlTypes.RootSchema);

        return delegateToSchema({
          schema: rootSchema,
          operation: 'query',
          fieldName: 'getEntity',
          args: { ...args, id: redirectEntityId },
          context,
          info
        });
      }

      return { id: args.id, raw: entity, entity, patterns: { links: [] } };
    }
  },
  EntityType: {
    __resolveType(obj, context, info) {
      const recognizer: PatternRecognizer = context.get(PatternTypes.Recognizer);

      const patterns: Pattern | IsEntity = recognizer.recognizeMerge(obj);

      return (patterns as IsEntity).name;
    }
  },
  Entity: {
    id(parent, args, context, info: IGraphQLToolsResolveInfo) {
      console.log('parent', parent, args, context);
      return parent.id;
    }
    //    raw(parent, args, context, info: IGraphQLToolsResolveInfo) {},
    //  entity(parent, args, context, info: IGraphQLToolsResolveInfo) {}
  }
};
