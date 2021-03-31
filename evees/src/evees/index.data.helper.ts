import { IndexData } from './interfaces/types';

export class IndexDataHelper {
  /** upsert indexData */
  static addOnEcosystem(newElements: string[], indexData?: IndexData): IndexData {
    if (!indexData) {
      return {
        linkChanges: {
          onEcosystem: {
            added: newElements,
            removed: [],
          },
        },
      };
    }

    if (!indexData.linkChanges) {
      indexData.linkChanges = {
        onEcosystem: {
          added: newElements,
          removed: [],
        },
      };
      return indexData;
    }

    if (!indexData.linkChanges.onEcosystem) {
      indexData.linkChanges.onEcosystem = {
        added: newElements,
        removed: [],
      };
      return indexData;
    }

    indexData.linkChanges.onEcosystem.added.push(...newElements);
    return indexData;
  }

  static getAddedOnEcosystem(indexData?: IndexData): string[] {
    const added =
      indexData &&
      indexData.linkChanges &&
      indexData.linkChanges.onEcosystem &&
      indexData.linkChanges.onEcosystem.added.length > 0
        ? indexData.linkChanges.onEcosystem.added
        : [];

    return added;
  }

  static getAddedChildren(indexData?: IndexData): string[] {
    const added =
      indexData &&
      indexData.linkChanges &&
      indexData.linkChanges.children &&
      indexData.linkChanges.children.added.length > 0
        ? indexData.linkChanges.children.added
        : [];

    return added;
  }
}
