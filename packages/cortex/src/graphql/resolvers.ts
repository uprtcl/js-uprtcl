import merge from 'lodash-es/merge';

import { PatternRecognizer } from '../recognizer/pattern-recognizer';
import { CortexBindings } from '../bindings';
import { Entity } from '../types/entity';
import { Behaviour } from '../types/behaviour';

export const cortexResolvers = {
  Entity: {
    id(parent) {
      return parent.id ? parent.id : parent;
    },
    _context(parent) {
      return parent;
    },
    async __resolveType(parent, { container }, info) {
      const recognizer: PatternRecognizer = container.get(CortexBindings.Recognizer);

      return recognizer.recognizeType(entityFromGraphQlObject(parent));
    },
  },
  EntityContext: {
    object(parent) {
      return entityFromGraphQlObject(parent).object;
    },
    async patterns(parent, args, { container }, info) {
      const entity = entityFromGraphQlObject(parent);

      const isGraphQlField = (key: string) =>
        key !== 'accessControl' && Object.keys(info.returnType.ofType._fields).includes(key);
      const recognizer: PatternRecognizer = container.get(CortexBindings.Recognizer);

      const behaviours: Behaviour<any>[] = recognizer.recognizeBehaviours(entity);

      const applyedPatterns = behaviours.map((pattern) => {
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
    },
  },
};

export function entityFromGraphQlObject(parent): Entity<any> {
  if (parent.id && parent.object && typeof parent.casID === 'string') return parent;

  const id = parent.id;

  let object = {};

  for (const key of Object.keys(parent)) {
    if (key !== 'id') object[key] = parent[key];
  }

  return {
    id,
    object,
  };
}

export function substituteFunction(object: Object): Object {
  for (const key of Object.keys(object)) {
    try {
      if (Array.isArray(object[key])) object[key] = object[key].map((o) => substituteFunction(o));
      else if (typeof object[key] === 'object') object[key] = substituteFunction(object[key]);
      else if (typeof object[key] === 'function') {
        const f = object[key];
        object[key] = () => f;
      }
    } catch (e) {}
  }

  return object;
}
