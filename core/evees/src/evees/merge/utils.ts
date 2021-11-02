import { Diff } from 'diff-match-patch-ts';
import { isEqual } from 'lodash';
import { EveesMutation } from '../interfaces/types';

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

export const mergeArrays = (originalLinks: string[], modificationsLinks: string[][]): string[] => {
  const allLinks: Map<string, boolean> = new Map();

  const originalLinksDic = {};
  for (let i = 0; i < originalLinks.length; i++) {
    const link = originalLinks[i];
    originalLinksDic[link] = {
      index: i,
      link: link,
    };
  }

  const newLinks: Array<Map<string, { index: number; link: string }>> = [];
  for (let i = 0; i < modificationsLinks.length; i++) {
    const newData = modificationsLinks[i];
    const links: Map<string, { index: number; link: string }> = new Map();
    for (let j = 0; j < newData.length; j++) {
      const link = newData[j];
      links[link] = {
        index: j,
        link: link,
      };
      allLinks[link] = true;
    }
    newLinks.push(links);
  }

  const resultLinks: any[] = [];
  for (const link of Object.keys(allLinks)) {
    const linkResult = mergeResult(
      originalLinksDic[link],
      newLinks.map((newLink) => newLink[link])
    );
    if (linkResult) {
      resultLinks.push(linkResult);
    }
  }

  const sortedLinks = resultLinks
    .sort((link1, link2) => link1.index - link2.index)
    .map((link) => link.link);

  return sortedLinks;
};

export const combineMutations = (mutations: EveesMutation[]): EveesMutation => {
  const mutation: EveesMutation = {
    newPerspectives: [],
    deletedPerspectives: [],
    updates: [],
  };

  mutations.forEach((thisMutation) => {
    mutation.newPerspectives.push(...thisMutation.newPerspectives);
    mutation.deletedPerspectives.push(...thisMutation.deletedPerspectives);
    mutation.updates.push(...thisMutation.updates);
  });

  return mutation;
};
