import { ArrayChanges, IndexData, LinkChanges, LinksType } from './interfaces/types';

export class IndexDataHelper {
  /** Create or append ArrayChanges to an IndexData */
  static combineArrayChanges(
    _changes?: ArrayChanges,
    linksType: LinksType = LinksType.children,
    indexData?: IndexData
  ): IndexData {
    let changes: ArrayChanges = _changes || { added: [], removed: [] };

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

    /** cancel removals and addings */
    indexData.linkChanges[linksType] = IndexDataHelper.appendArrayChanges(
      changes,
      indexData.linkChanges[linksType] as ArrayChanges
    );

    return indexData;
  }

  static appendArrayChanges(changes: ArrayChanges, newChanges: ArrayChanges): ArrayChanges {
    const resultChanges: ArrayChanges = {
      added: [...changes.added],
      removed: [...changes.removed],
    };

    /** removes cancel additions and viceversa */
    changes.added.map((added) => {
      const ixOfRemoved = newChanges.removed.indexOf(added);
      if (ixOfRemoved !== -1) {
        resultChanges.removed.splice(ixOfRemoved, 1);
      } else {
        resultChanges.added.push(added);
      }
    });

    changes.removed.map((removed) => {
      const ixOfAdded = newChanges.added.indexOf(removed);
      if (ixOfAdded !== -1) {
        resultChanges.added.splice(ixOfAdded, 1);
      } else {
        resultChanges.removed.push(removed);
      }
    });

    return resultChanges;
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
