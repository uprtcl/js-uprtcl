export interface CacheService {
  /**
   * Gets the object with the given hash from the cache, if it existed
   */
  get<T extends object>(hash: string): Promise<T | undefined>;

  /**
   * Puts the given object with the given hash in the cache
   */
  cache<T extends object>(hash: string, object: T): Promise<void>;
}
