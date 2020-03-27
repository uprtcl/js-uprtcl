import { merge } from 'lodash-es';

import { PatternRecognizer } from '../recognizer/pattern-recognizer';
import { CortexBindings } from '../bindings';
import { Pattern } from '../types/pattern';
import { Entity } from '../types/entity';

export const cortexResolvers = {
  Entity: {
    async __resolveType(parent, { container }, info) {
      const entity = entityFromGraphQlObject(parent);

      const recognizer: PatternRecognizer = container.get(CortexBindings.Recognizer);

      const patterns: Pattern<any>[] = recognizer.recognize(entity);

      const types: string[] = patterns.map(p => p.type).filter(t => !!t) as string[];

      if (types.length === 0) {
        throw new Error(`No entity found to recognize object ${JSON.stringify(entity)}`);
      }

      const abmiguousError = types.length > 1 && !types.every(t => types[0]);

      if (abmiguousError) {
        throw new Error(
          `Ambiguous error recognizing entity: ${parent.toString()}. These two types recognized the object ${types.toString()}`
        );
      }
      return types[0];
    }
  },
  EntityContext: {
    raw(parent) {
      return JSON.stringify(entityFromGraphQlObject(parent).entity);
    },
    async patterns(parent, args, { container }, info) {
      const entity = entityFromGraphQlObject(parent);

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

export function entityFromGraphQlObject(parent): Entity<any> {
  const id = parent.id;

  let entity = {};

  for (const key of Object.keys(parent)) {
    if (key !== 'id') entity[key] = parent[key];
  }

  return {
    id,
    entity
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
