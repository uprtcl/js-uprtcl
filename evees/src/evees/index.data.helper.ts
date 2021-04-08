import { ArrayChanges, IndexData, LinksType } from './interfaces/types';

export class IndexDataHelper {
  /** Create or append ArrayChanges to an IndexData */
  static combineArrayChanges(
    changes?: ArrayChanges,
    linksType: LinksType = LinksType.children,
    indexData?: IndexData
  ): IndexData {
    changes = changes || { added: [], removed: [] };

    if (!indexData) {
      return {
        linkChanges: {
          [linksType]: {
            added: changes.added,
            removed: changes.removed,
          },
        },
      };
    }

    if (!indexData.linkChanges) {
      indexData.linkChanges = {
        [linksType]: {
          added: changes.added,
          removed: changes.removed,
        },
      };
      return indexData;
    }

    if (!indexData.linkChanges[linksType]) {
      indexData.linkChanges[linksType] = {
        added: changes.added,
        removed: changes.removed,
      };
      return indexData;
    }

    (indexData.linkChanges[linksType] as ArrayChanges).added.push(...changes.added);
    (indexData.linkChanges[linksType] as ArrayChanges).removed.push(...changes.removed);

    return indexData;
  }

  static getArrayChanges(
    indexData?: IndexData,
    linksType: LinksType = LinksType.children
  ): ArrayChanges {
    const changes: ArrayChanges =
      indexData && indexData.linkChanges && indexData.linkChanges[linksType]
        ? (indexData.linkChanges[linksType] as ArrayChanges)
        : {
            added: [],
            removed: [],
          };

    return changes;
  }

  static combine(indexData?: IndexData, withIndexData?: IndexData): IndexData {
    indexData = this.combineArrayChanges(
      this.getArrayChanges(withIndexData),
      LinksType.children,
      indexData
    );
    indexData = this.combineArrayChanges(
      this.getArrayChanges(withIndexData),
      LinksType.linksTo,
      indexData
    );
    indexData = this.combineArrayChanges(
      this.getArrayChanges(withIndexData),
      LinksType.onEcosystem,
      indexData
    );
    return indexData;
  }
}
