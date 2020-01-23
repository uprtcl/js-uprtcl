import { merge, cloneDeepWith } from 'lodash-es';
import gql from 'graphql-tag';

import { PatternRecognizer, Pattern, Entity, CortexModule, Hashed } from '@uprtcl/cortex';
import { DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';

import { getIsomorphisms, entityContent } from '../utils/entities';

export const cortexSchema = gql`
  extend type EntityContext {
    patterns: Patterns!
  }

  type Patterns {
    links: [Entity!]

    content: Entity! @discover
    isomorphisms: [Entity!]! @discover
  }
`;

export const cortexResolvers = {
  Entity: {
    async __resolveType(parent, { container }, info) {
      const entity = await entityFromParent(parent);

      const recognizer: PatternRecognizer = container.get(CortexModule.bindings.Recognizer);

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
  EntityContext: {
    async patterns(parent, args, { container }, info) {
      const entity = await entityFromParent(parent);

      const isGraphQlField = (key: string) =>
        Object.keys(info.returnType.ofType._fields).includes(key);
      const recognizer: PatternRecognizer = container.get(CortexModule.bindings.Recognizer);

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
    }
  },
  Patterns: {
    async content(parent, args, { container }, info) {
      const entity = parent.__entity;

      const recognizer: PatternRecognizer = container.get(CortexModule.bindings.Recognizer);
      const discovery: DiscoveryService = container.get(DiscoveryModule.bindings.DiscoveryService);

      return entityContent(entity, recognizer, discovery);
    },
    async isomorphisms(parent, args, { container }, info) {
      const entity = parent.__entity;

      const recognizer: PatternRecognizer = container.get(CortexModule.bindings.Recognizer);

      const discovery: DiscoveryService = container.get(DiscoveryModule.bindings.DiscoveryService);

      const isomorphisms = await getIsomorphisms(recognizer, entity, (id: string) =>
        discovery.get(id)
      );

      return isomorphisms;
    }
  }
};

export async function entityFromParent(parent): Promise<Hashed<any>> {
  const id = parent.id;

  let object = {};

  for (const key of Object.keys(parent)) {
    if (key !== 'id') object[key] = parent[key];
  }

  return {
    id,
    object
  };
}
