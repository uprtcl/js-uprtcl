import { gql } from 'apollo-boost';

import {
  DiscoveryTypes,
  PatternTypes,
  DiscoveryService,
  PatternRecognizer,
  Hashed,
  HasRedirect,
  Pattern,
  IsEntity
} from '@uprtcl/cortex';

export const baseTypeDefs = gql`
  scalar JSON

  type EmptyEntity {
    _: Boolean
  }

  union EntityType = EmptyEntity

  type Query {
    getEntity(id: ID!, depth: Int = 1): Entity!
  }

  type Entity {
    id: ID!
    raw: JSON!
    entity: EntityType!
    content: EntityType!
    patterns: Patterns!
  }

  type Patterns {
    links: [Entity!]
  }
`;

export const baseResolvers = {
  Query: {
    async getEntity(parent, args, context, info) {
      const discoveryService: DiscoveryService = context.get(DiscoveryTypes.DiscoveryService);

      const entity: Hashed<any> | undefined = await discoveryService.get(args.id);

      if (!entity) throw new Error('Entity was not found');

      return { id: args.id, raw: entity, entity, patterns: { links: [] } };
    }
  },
  EntityType: {
    __resolveType(obj, context, info) {
      console.log('resolveType', obj);
      const recognizer: PatternRecognizer = context.get(PatternTypes.Recognizer);

      const patterns: Pattern | IsEntity = recognizer.recognizeMerge(obj);
      console.log('resolveType2', patterns);

      return (patterns as IsEntity).name;
    }
  },
  Entity: {
    async content(parent, args, context, info) {
      const entity = parent.entity;
      const recognizer: PatternRecognizer = context.get(PatternTypes.Recognizer);
      const discovery: DiscoveryService = context.get(DiscoveryTypes.DiscoveryService);

      return redirectEntity(entity, recognizer, discovery);
    }
    //    raw(parent, args, context, info: IGraphQLToolsResolveInfo) {},
    //  entity(parent, args, context, info: IGraphQLToolsResolveInfo) {}
  }
};

export async function redirectEntity(
  entity: any,
  recognizer: PatternRecognizer,
  discovery: DiscoveryService
): Promise<any | undefined> {
  const patterns: Pattern | HasRedirect = recognizer.recognizeMerge(entity);

  if ((patterns as HasRedirect).redirect) {
    const redirectEntityId = await (patterns as HasRedirect).redirect(entity);

    if (redirectEntityId) {
      const redirectedEntity: Hashed<any> | undefined = await discovery.get(redirectEntityId);
      return redirectEntity(redirectedEntity, recognizer, discovery);
    }
  }

  return entity;
}
