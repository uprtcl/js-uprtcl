import { Diff } from 'diff-match-patch-ts';
import isEqual from 'lodash-es/isEqual';

import { DiffUtils } from './diff.utils';

export function mergeStrings(originalString: string, newStrings: string[]): string {
  const diffs = newStrings.map((newString) => DiffUtils.charDiff(originalString, newString));

  const alignedDiffs = DiffUtils.alignDiffs(diffs);
  let mergeDiffs: Diff[] = [];
  for (let i = 0; i < alignedDiffs.original.length; i++) {
    const mergeDiff = mergeResult(
      alignedDiffs.original[i],
      alignedDiffs.news.map((newChar) => newChar[i])
    );
    mergeDiffs.push(mergeDiff);
  }

  return DiffUtils.applyDiff(originalString, mergeDiffs);
}

/**
 *
 * @param original
 * @param modifications
 * @returns the appropiate result of the merge
 */
export function mergeResult<A>(original: A, modifications: A[]): A {
  const changes = modifications.filter((modification) => !isEqual(original, modification));

  switch (changes.length) {
    // Object has not changed
    case 0:
      return original;
    case 1:
      return changes[0];
    default:
      if (changes.every((change) => isEqual(changes[0], change))) {
        return changes[0];
      }
      throw new Error('conflict when trying to merge');
  }
}
