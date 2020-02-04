import { merge, cloneDeepWith } from 'lodash-es';

import { PatternRecognizer } from '../recognizer/pattern.recognizer';
import { CortexBindings } from '../bindings';
import { Pattern, Entity } from '../pattern';
import { Hashed } from '../properties/hashable';

export const cortexResolvers = {
  Entity: {
    async __resolveType(parent, { container }, info) {
      const entity = hashedFromGraphQlObject(parent);

      const recognizer: PatternRecognizer = container.get(CortexBindings.Recognizer);

      const patterns: Pattern[] = recognizer.recognize(entity);

      const entities: Entity[] = patterns.filter(p => (p as Entity).name) as Entity[];

      if (entities.length === 0) {
        throw new Error(`No entity found to recognize object ${JSON.stringify(entity)}`);
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
    raw(parent) {
      return JSON.stringify(hashedFromGraphQlObject(parent).object);
    },
    async patterns(parent, args, { container }, info) {
      const entity = hashedFromGraphQlObject(parent);

      const isGraphQlField = (key: string) =>
        key !== 'accessControl' && Object.keys(info.returnType.ofType._fields).includes(key);
      const recognizer: PatternRecognizer = container.get(CortexBindings.Recognizer);

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

      return substituteFunction(accPatterns);
    }
  }
};

export function hashedFromGraphQlObject(parent): Hashed<any> {
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

export function substituteFunction(object: Object): Object {
  for (const key of Object.keys(object)) {
    try {
      if (Array.isArray(object[key])) object[key] = object[key].map(o => substituteFunction(o));
      else if (typeof object[key] === 'object') object[key] = substituteFunction(object[key]);
      else if (typeof object[key] === 'function') {
        const f = object[key];
        object[key] = () => f;
      }
    } catch (e) {}
  }

  return object;
}
