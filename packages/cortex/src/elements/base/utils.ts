import { PatternRecognizer } from '../../patterns/recognizer/pattern.recognizer';
import { Isomorphisms, Lens } from '../../types';
import { Pattern } from '../../patterns/pattern';
import { HasLenses } from '../../patterns/properties/has-lenses';

export function getLenses(
  patternRecognizer: PatternRecognizer,
  isomorphisms: Isomorphisms
): Lens[] {
  let lenses: Lens[] = [];

  for (const isomorphism of isomorphisms.isomorphisms) {
    const patterns: Array<Pattern | HasLenses> = patternRecognizer.recognize(isomorphism);
    for (const pattern of patterns) {
      if ((pattern as HasLenses).getLenses) {
        lenses = lenses.concat(
          (pattern as HasLenses).getLenses(isomorphism, isomorphisms.entity)
        );
      }
    }
  }

  return lenses;
}
