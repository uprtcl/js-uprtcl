import { gql, ApolloClient } from 'apollo-boost';
import { merge, cloneDeep, cloneDeepWith } from 'lodash';

import {
  DiscoveryTypes,
  PatternTypes,
  DiscoveryService,
  PatternRecognizer,
  Hashed,
  Pattern,
  Entity
} from '@uprtcl/cortex';

import { getIsomorphisms, loadEntity } from '../utils/entities';
import { GraphQlTypes } from '../types';
import { GraphQLResolveInfo } from 'graphql';

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
    links: [Entity!]
    actions: [Action!]
    lenses: [Lens!]
  }

  type Lens {
    name: String!
    render: Function!
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

      const entity: Hashed<any> | undefined = await discovery.get(id);

      if (!entity) throw new Error('Entity was not found');
      return { id, raw: entity, entity };
    }
  },
  EntityType: {
    __resolveType(obj, { container }, info) {
      const recognizer: PatternRecognizer = container.get(PatternTypes.Recognizer);

      const patterns: Pattern[] = recognizer.recognize(obj);

      const entities: Entity[] = patterns.filter(p => (p as Entity).name) as Entity[];

      if (entities.length === 0) throw new Error('No entity found to recognize object');

      const abmiguousError =
        entities.length > 1 && !entities.every(entity => entity.name === entities[0].name);

      if (abmiguousError) {
        throw new Error(
          `Ambiguous error recognizing entity: ${obj.toString()}. These two entites recognized the object ${entities.toString()}`
        );
      }

      return entities[0].name;
    },
    patterns(parent, args, context, info) {
      const isGraphQlField = (key: string) =>
        Object.keys(info.returnType.ofType._fields).includes(key);
      const recognizer: PatternRecognizer = context.container.get(PatternTypes.Recognizer);

      const patterns = recognizer.recognize(parent);
      const applyedPatterns = patterns.map(pattern => {
        const applyedPattern = {};

        for (const key of Object.keys(pattern)) {
          if (isGraphQlField(key)) {
            applyedPattern[key] = pattern[key](parent);
          }
        }
        return applyedPattern;
      });

      const accPatterns = {};
      merge(accPatterns, ...applyedPatterns);

      return cloneDeepWith(accPatterns, (value: any) => {
        if (typeof value === 'function') return () => value;
      });
    }
  },
  Entity: {
    id(parent) {
      return parent.id ? parent.id : parent;
    },
    async raw(parent, _, { container }) {
      const id = typeof parent === 'string' ? parent : parent.id;

      const discovery: DiscoveryService = container.get(DiscoveryTypes.DiscoveryService);

      const entity: Hashed<any> | undefined = await discovery.get(id);

      if (!entity) throw new Error('Entity was not found');
      return entity;
    },
    async entity(parent, _, { container }) {
      const id = typeof parent === 'string' ? parent : parent.id;

      const discovery: DiscoveryService = container.get(DiscoveryTypes.DiscoveryService);

      const entity: Hashed<any> | undefined = await discovery.get(id);

      if (!entity) throw new Error('Entity was not found');
      return entity;
    },
    async content(parent, args, { container }, info) {
      const entity =
        parent.entity || (await loadEntity(container.get(GraphQlTypes.Client), parent));
      const recognizer: PatternRecognizer = container.get(PatternTypes.Recognizer);
      const discovery: DiscoveryService = container.get(DiscoveryTypes.DiscoveryService);

      return redirectEntity(entity, recognizer, discovery);
    },
    async isomorphisms(parent, args, { container }, info) {
      const entity =
        parent.entity || (await loadEntity(container.get(GraphQlTypes.Client), parent));

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
  const hasRedirect = recognizer.recognizeUniqueProperty(entity, prop => !!prop.redirect);

  if (hasRedirect) {
    const redirectEntityId = await hasRedirect.redirect(entity);

    if (redirectEntityId) {
      const redirectedEntity: Hashed<any> | undefined = await discovery.get(redirectEntityId);
      return redirectEntity(redirectedEntity, recognizer, discovery);
    }
  }

  return entity;
}
