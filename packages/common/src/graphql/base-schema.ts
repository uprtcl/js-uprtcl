import { gql, ApolloClient } from 'apollo-boost';

import {
  DiscoveryTypes,
  PatternTypes,
  DiscoveryService,
  PatternRecognizer,
  Hashed,
  HasRedirect,
  Pattern,
  IsEntity,
  HasActions,
  HasLinks
} from '@uprtcl/cortex';
import { getIsomorphisms, loadEntity } from '../utils/entities';
import { GraphQlTypes } from '../types';

export const baseTypeDefs = gql`
  scalar JSON
  scalar Function

  type EmptyEntity {
    _: Boolean
  }

  interface EntityType {
    patterns: Patterns!
  }

  type Query {
    getEntity(id: ID!, depth: Int = 1): Entity!
  }

  type Entity {
    id: ID!
    raw: JSON!
    entity: EntityType!
    content: Entity!
    isomorphisms: [EntityType!]!
  }

  type Patterns {
    getLinks: [Entity!]
    actions: [Action!]
  }

  type Action {
    icon: String!
    title: String!
    action: Function!
  }
`;

export const baseResolvers = {
  Query: {
    async getEntity(parent, { id, depth }, { cache, container }, info) {
      const discovery: DiscoveryService = container.get(DiscoveryTypes.DiscoveryService);

      console.log('hi');

      const entity: Hashed<any> | undefined = await discovery.get(id);

      if (!entity) throw new Error('Entity was not found');

      return { id, raw: entity, entity };
    }
  },
  EntityType: {
    __resolveType(obj, { container }, info) {
      const recognizer: PatternRecognizer = container.get(PatternTypes.Recognizer);

      const patterns: Pattern | IsEntity = recognizer.recognizeMerge(obj);

      return (patterns as IsEntity).name;
    },
    patterns(parent, args, { container }, info) {
      const recognizer: PatternRecognizer = container.get(PatternTypes.Recognizer);

      const patterns: Pattern | IsEntity = recognizer.recognizeMerge(parent);

      const curriedPatterns = {};

      for (const key of Object.keys(patterns)) {
        let value = patterns[key];
        if (typeof value === 'function') {
          value = () => value(parent);
        }

        curriedPatterns[key] = value;
      }

      console.log(curriedPatterns);

      return { object: parent, patterns, ...curriedPatterns };
    }
  },
  Patterns: {
    getLinks(parent) {
      const patterns = parent.patterns;
      console.log('parent', parent);
      if (!(patterns as HasLinks).getLinks) return undefined;

      return (patterns as HasLinks).getLinks(parent.object);
    },
    actions(parent, args, { container }, info) {
      const patterns = parent.patterns;
      console.log('parent', parent);
      if (!(patterns as HasActions).getActions) return undefined;

      const actions = (patterns as HasActions).getActions(parent.object, '');
      console.log('actions', actions);
      return actions.map(a => ({
        ...a,
        action: () => (element: HTMLElement) => a.action(element)
      }));
    }
  },
  Entity: {
    id(parent) {
      console.log('hey', parent);
      return parent.id ? parent.id : parent;
    },
    async content(parent, args, { container }, info) {
      const entity = parent.entity;
      const recognizer: PatternRecognizer = container.get(PatternTypes.Recognizer);
      const discovery: DiscoveryService = container.get(DiscoveryTypes.DiscoveryService);

      return redirectEntity(entity, recognizer, discovery);
    },
    async isomorphisms(parent, args, { container }, info) {
      const recognizer: PatternRecognizer = container.get(PatternTypes.Recognizer);
      const client: ApolloClient<any> = container.get(GraphQlTypes.Client);

      const isomorphisms = await getIsomorphisms(recognizer, parent.raw, (id: string) =>
        loadEntity(client, id)
      );

      return isomorphisms;
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
