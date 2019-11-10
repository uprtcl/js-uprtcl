import { PatternRecognizer, Pattern, Transformable, HasRedirect } from '@uprtcl/cortex';

import { HasLenses } from '../properties/has-lenses';
import { Isomorphisms, Lens } from '../types';

export function getLenses(
  patternRecognizer: PatternRecognizer,
  isomorphisms: Isomorphisms
): Lens[] {
  let lenses: Lens[] = [];

  for (const isomorphism of isomorphisms.isomorphisms) {
    const patterns: Array<Pattern | HasLenses> = patternRecognizer.recognize(isomorphism);
    for (const pattern of patterns) {
      if ((pattern as HasLenses).getLenses) {
        lenses = lenses.concat((pattern as HasLenses).getLenses(isomorphism, isomorphisms.entity));
      }
    }
  }

  return lenses;
}

export function getIsomorphisms(
  patternRecognizer: PatternRecognizer,
  entity: any,
  selectEntity: (id: string) => any
): { entitiesToLoad: Array<string>; isomorphisms: Array<any> } {
  let isomorphisms: any[] = [entity];

  const transformIsomorphisms = transformEntity(patternRecognizer, entity);
  isomorphisms = isomorphisms.concat(transformIsomorphisms);

  // Recursive call to get all isomorphisms from redirected entities
  const { isomorphisms: redirectedIsomorphisms, entitiesToLoad } = redirectEntity(
    patternRecognizer,
    entity,
    selectEntity
  );
  isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
  return { isomorphisms, entitiesToLoad };
}

function redirectEntity(
  patternRecognizer: PatternRecognizer,
  entity: object,
  selectEntity: (id: string) => any
): { entitiesToLoad: Array<string>; isomorphisms: Array<any> } {
  const patterns: Array<Pattern | HasRedirect> = patternRecognizer.recognize(entity);

  let isomorphisms: any[] = [];
  let entitiesToLoad: string[] = [];

  for (const pattern of patterns) {
    if ((pattern as HasRedirect).redirect) {
      const redirectHash = (pattern as HasRedirect).redirect(entity);

      if (redirectHash) {
        const redirectEntity = selectEntity(redirectHash);

        if (redirectEntity) {
          const {
            isomorphisms: redirectedIsomorphisms,
            entitiesToLoad: redirectedEntitiesToLoad
          } = getIsomorphisms(patternRecognizer, redirectEntity, selectEntity);

          isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
          entitiesToLoad = entitiesToLoad.concat(redirectedEntitiesToLoad);
        } else {
          entitiesToLoad.push(redirectHash);
        }
      }
    }
  }

  return { isomorphisms, entitiesToLoad };
}

function transformEntity<T extends object>(
  patternRecognizer: PatternRecognizer,
  entity: T
): Array<any> {
  const patterns: Array<Pattern | Transformable<any>> = patternRecognizer.recognize(entity);

  let isomorphisms: Array<any> = [];

  for (const pattern of patterns) {
    if ((pattern as Transformable<any>).transform) {
      const transformedEntities: Array<any> = (pattern as Transformable<any>).transform(entity);

      isomorphisms = isomorphisms.concat(transformedEntities);
    }
  }

  return isomorphisms;
}
