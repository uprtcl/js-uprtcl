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

  static setOnEcosystem(onEcosystem: string[], indexData?: IndexData): IndexData {
    if (indexData) {
      indexData.onEcosystem = onEcosystem;
      return indexData;
    } else {
      return {
        onEcosystem,
      };
    }
  }

  static appendArrayChanges(changes: ArrayChanges, newChanges: ArrayChanges): ArrayChanges {
    /** use sets to remove duplicates */
    const changesSet = {
      added: new Set(changes.added),
      removed: new Set(changes.removed),
    };

    const newChangesSet = {
      added: new Set(newChanges.added),
      removed: new Set(newChanges.removed),
    };

    // merge sets efficiently https://stackoverflow.com/a/32001750/1943661
    const mergedChangesSet = {
      added: new Set(
        (function* () {
          yield* changesSet.added;
          yield* newChangesSet.added;
        })()
      ),
      removed: new Set(
        (function* () {
          yield* changesSet.removed;
          yield* newChangesSet.removed;
        })()
      ),
    };

    return {
      added: Array.from(mergedChangesSet.added),
      removed: Array.from(mergedChangesSet.removed),
    };
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
    indexData.text = withIndexData ? withIndexData.text : undefined;

    return indexData;
  }
}
