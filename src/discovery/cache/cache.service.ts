import { Source } from '../sources/source';

export interface CacheService extends Source {
  /**
   * Puts the given object with the given hash in the cache
   */
  cache<T extends object>(hash: string, object: T): Promise<void>;
}
