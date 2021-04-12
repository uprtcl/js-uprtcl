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

    /** removes cancel additions and viceversa */
    const newChanges = indexData.linkChanges[linksType] as ArrayChanges;

    changes.added.map((added) => {
      const ixOfRemoved = newChanges.removed.indexOf(added);
      if (ixOfRemoved !== -1) {
        newChanges.removed.splice(ixOfRemoved, 1);
      } else {
        newChanges.added.push(added);
      }
    });

    changes.removed.map((removed) => {
      const ixOfAdded = newChanges.added.indexOf(removed);
      if (ixOfAdded !== -1) {
        newChanges.added.splice(ixOfAdded, 1);
      } else {
        newChanges.removed.push(removed);
      }
    });

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
      this.getArrayChanges(withIndexData, LinksType.children),
      LinksType.children,
      indexData
    );
    indexData = this.combineArrayChanges(
      this.getArrayChanges(withIndexData, LinksType.linksTo),
      LinksType.linksTo,
      indexData
    );
    indexData = this.combineArrayChanges(
      this.getArrayChanges(withIndexData, LinksType.onEcosystem),
      LinksType.onEcosystem,
      indexData
    );
    indexData.text = withIndexData ? withIndexData.text : undefined;

    return indexData;
  }
}
