import { CacheService } from './cache.service';
import Dexie from 'dexie';
import { injectable } from 'inversify';

@injectable()
export class CacheDexie extends Dexie implements CacheService {
  cacheObjects: Dexie.Table<any, string>;

  constructor() {
    super('cache-objects');
    this.version(0.1).stores({
      cacheObjects: ''
    });
    this.cacheObjects = this.table('cacheObjects');
  }

  /**
   * @override
   */
  async get<T extends object>(hash: string): Promise<T | undefined> {
    if (!hash) {
      debugger
    }
    // if (!!hash) {
      return this.cacheObjects.get(hash);
    // }
  }

  /**
   * @override
   */
  async ready(): Promise<void> {}

  /**
   * @override
   */
  async cache<T>(hash: string, object: T): Promise<void> {
    await this.cacheObjects.put(object, hash);
  }
}
