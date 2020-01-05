import { merge, cloneDeepWith } from 'lodash-es';
import { gql, ApolloClient } from 'apollo-boost';

import { PatternRecognizer, Pattern, Entity, CortexModule, Hashed } from '@uprtcl/cortex';
import { DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';

import { getIsomorphisms, entityContent } from '../utils/entities';
import { ApolloClientModule } from '../graphql/apollo-client.module';

export const cortexSchema = gql`
  extend interface Entity {
    _patterns: Patterns!
  }

  type Patterns {
    links: [Entity!]

    content: Entity!
    isomorphisms: [Entity!]!
  }
`;

export const cortexResolvers = {
  Entity: {
    async __resolveType(parent, { container }, info) {
      const entity = await entityFromParent(parent, container);

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
    },
    async _patterns(parent, args, { container }, info) {
      const entity = await entityFromParent(parent, container);

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
    }
  },
  Patterns: {
    async content(parent, args, { container }, info) {
      const entity = await entityFromParent(parent, container);

      const recognizer: PatternRecognizer = container.get(CortexModule.types.Recognizer);
      const discovery: DiscoveryService = container.get(DiscoveryModule.types.DiscoveryService);

      const content: Hashed<any> = await entityContent(entity, recognizer, discovery);

      return { ...content.object, id: content.id };
    },
    async isomorphisms(parent, args, { container }, info) {
      const entity = await entityFromParent(parent, container);

      const recognizer: PatternRecognizer = container.get(CortexModule.types.Recognizer);
      const client: ApolloClient<any> = container.get(ApolloClientModule.types.Client);

      const discovery: DiscoveryService = container.get(DiscoveryModule.types.DiscoveryService);

      const isomorphisms = await getIsomorphisms(recognizer, entity, (id: string) =>
        discovery.get(id)
      );

      return isomorphisms;
    }
  }
};

export async function entityFromParent(parent, container): Promise<Hashed<any>> {
  const discovery: DiscoveryService = container.get(DiscoveryModule.types.DiscoveryService);
  let id: string | undefined = undefined;

  if (parent.id) id = parent.id;
  else if (parent.__entity) return parent.__entity;
  else if (typeof parent === 'string') id = parent;

  if (!id) return parent;

  const object = await discovery.get(id);

  if (!object) throw new Error(`Entity with id ${id} not found`);

  return object;
}
