import { IndexData } from './interfaces/types';

export class IndexDataHelper {
  /** Create or append ArrayChanges to an IndexData */
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
}
