import { PatternRecognizer, Pattern, HasLenses } from '@uprtcl/cortex';

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
