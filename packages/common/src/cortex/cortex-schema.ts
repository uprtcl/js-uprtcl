import gql from 'graphql-tag';
import { merge, cloneDeepWith } from 'lodash-es';
import { ApolloClient } from 'apollo-boost';

import {
  PatternRecognizer,
  CortexTypes,
  DiscoveryService,
  Hashed,
  DiscoveryTypes,
  Pattern,
  Entity
} from '@uprtcl/cortex';

import { loadEntity, getIsomorphisms } from '../utils/entities';
import { GraphQlTypes } from '../types';

export const cortexSchema = gql`
  extend type Entity {
    content: Entity!
    isomorphisms: [Entity!]!

    patterns: Patterns!
  }

  type Patterns {
    links: [Entity!]
  }
`;

export const cortexResolvers = {
  EntityType: {
    __resolveType(parent, { container }, info) {
      const entity = parent.__entity ? parent.__entity : parent;

      const recognizer: PatternRecognizer = container.get(CortexTypes.Recognizer);

      const patterns: Pattern[] = recognizer.recognize(entity);

      const entities: Entity[] = patterns.filter(p => (p as Entity).name) as Entity[];

      if (entities.length === 0) {
        throw new Error('No entity found to recognize object');
      }

      const abmiguousError =
        entities.length > 1 && !entities.every(entity => entity.name === entities[0].name);

      if (abmiguousError) {
        throw new Error(
          `Ambiguous error recognizing entity: ${parent.toString()}. These two entites recognized the object ${entities.toString()}`
        );
      }
      return entities[0].name;
    }
  },

  Entity: {
    async patterns(parent, args, { container }, info) {
      let entity = parent.raw;

      if (!entity && typeof parent === 'string')
        entity = await loadEntity(container.get(GraphQlTypes.Client), parent);
      else if (!entity && parent.entity) entity = parent.entity;

      const isGraphQlField = (key: string) =>
        Object.keys(info.returnType.ofType._fields).includes(key);
      const recognizer: PatternRecognizer = container.get(CortexTypes.Recognizer);

      const patterns = recognizer.recognize(entity);
      const applyedPatterns = patterns.map(pattern => {
        const applyedPattern = {};

        for (const key of Object.keys(pattern)) {
          if (isGraphQlField(key)) {
            applyedPattern[key] = pattern[key](entity);
          }
        }
        return applyedPattern;
      });

      const accPatterns = {};
      merge(accPatterns, ...applyedPatterns, { __entity: entity });

      return cloneDeepWith(accPatterns, (value: any) => {
        if (typeof value === 'function') return () => value;
      });
    },
    async content(parent, args, { container }, info) {
      let entity = parent.raw;

      if (!entity && typeof parent === 'string')
        entity = await loadEntity(container.get(GraphQlTypes.Client), parent);
      else if (!entity && parent.entity) entity = parent.entity;

      const recognizer: PatternRecognizer = container.get(CortexTypes.Recognizer);
      const discovery: DiscoveryService = container.get(DiscoveryTypes.DiscoveryService);

      return redirectEntity(entity, recognizer, discovery);
    },
    async isomorphisms(parent, args, { container }, info) {
      let entity = parent.raw;

      if (!entity && typeof parent === 'string')
        entity = await loadEntity(container.get(GraphQlTypes.Client), parent);
      else if (!entity && parent.entity) entity = parent.entity;

      const recognizer: PatternRecognizer = container.get(CortexTypes.Recognizer);
      const client: ApolloClient<any> = container.get(GraphQlTypes.Client);

      const isomorphisms = await getIsomorphisms(recognizer, entity, (id: string) =>
        loadEntity(client, id)
      );

      return isomorphisms;
    }
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
