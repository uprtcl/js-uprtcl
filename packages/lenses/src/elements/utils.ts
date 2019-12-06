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
      if ((pattern as HasLenses).lenses) {
        lenses = lenses.concat((pattern as HasLenses).lenses(isomorphism));
      }
    }
  }

  return lenses;
}

export async function getIsomorphisms(
  patternRecognizer: PatternRecognizer,
  entity: any,
  loadEntity: (id: string) => Promise<any>
): Promise<any[]> {
  let isomorphisms: any[] = [entity];

  const transformIsomorphisms = transformEntity(patternRecognizer, entity);
  isomorphisms = isomorphisms.concat(transformIsomorphisms);

  // Recursive call to get all isomorphisms from redirected entities
  const redirectedIsomorphisms = await redirectEntity(patternRecognizer, entity, loadEntity);
  isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
  return isomorphisms;
}

async function redirectEntity(
  patternRecognizer: PatternRecognizer,
  entity: object,
  loadEntity: (id: string) => Promise<any>
): Promise<any[]> {
  const hasRedirects: Array<HasRedirect> = patternRecognizer.recognizeProperties(
    entity,
    prop => !!(prop as HasRedirect<any>).redirect
  );

  let isomorphisms: any[] = [];

  for (const hasRedirect of hasRedirects) {
    const redirectHash = await hasRedirect.redirect(entity);

    if (redirectHash) {
      const redirectEntity = await loadEntity(redirectHash);

      if (redirectEntity) {
        const redirectedIsomorphisms = await getIsomorphisms(
          patternRecognizer,
          redirectEntity,
          loadEntity
        );

        isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
      }
    }
  }

  return isomorphisms;
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
