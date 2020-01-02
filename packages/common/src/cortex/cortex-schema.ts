import { merge, cloneDeepWith } from 'lodash-es';
import { gql, ApolloClient } from 'apollo-boost';

import { PatternRecognizer, Pattern, Entity, CortexModule, Hashed } from '@uprtcl/cortex';
import { DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';

import { loadEntity, getIsomorphisms, getEntityContent } from '../utils/entities';
import { GqlCortexModule } from './gql-cortex.module';
import { ApolloClientModule } from 'src/graphql/apollo-client.module';

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

      const recognizer: PatternRecognizer = container.get(CortexModule.types.Recognizer);

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
      const entity = await getEntityFromParent(parent, container);

      const isGraphQlField = (key: string) =>
        Object.keys(info.returnType.ofType._fields).includes(key);
      const recognizer: PatternRecognizer = container.get(CortexModule.types.Recognizer);

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
      const entity = await getEntityFromParent(parent, container);

      const recognizer: PatternRecognizer = container.get(CortexModule.types.Recognizer);
      const discovery: DiscoveryService = container.get(DiscoveryModule.types.DiscoveryService);

      return getEntityContent(entity, recognizer, discovery);
    },
    async isomorphisms(parent, args, { container }, info) {
      const entity = await getEntityFromParent(parent, container);

      const recognizer: PatternRecognizer = container.get(CortexModule.types.Recognizer);
      const client: ApolloClient<any> = container.get(ApolloClientModule.types.Client);

      const isomorphisms = await getIsomorphisms(recognizer, entity, (id: string) =>
        loadEntity(client, id)
      );

      return isomorphisms;
    }
  }
};

export async function getEntityFromParent(parent, container): Promise<Hashed<any>> {
  if (parent.raw) return parent.raw;
  if (parent.entity) return parent.entity;
  if (typeof parent === 'string') return loadEntity(container.get(ApolloClientModule.types.Client), parent);

  return parent;
}
