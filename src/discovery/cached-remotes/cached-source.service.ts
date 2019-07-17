import { CacheService } from '../cache/cache.service';
import { Source } from '../sources/source';
import { Logger } from '../../utils/logger';

export class CachedSourceService implements Source {
  protected logger = new Logger('CachedSource');

  constructor(protected cache: CacheService, protected remote: Source) {}

  /**
   * Get the object identified by the given hash from cache or from remote
   * @param hash the hash identifying the object
   * @returns the object if found, undefined otherwise
   */
  public async get<O extends object>(hash: string): Promise<O | undefined> {
    // If we have the object in the cache, return it
    let object = await this.cache.get<O>(hash);
    if (object) {
      this.logger.info(`Object with hash ${hash} was in cache: ${object}`);
      return object;
    }

    this.logger.info(`Object with hash ${hash} was not in cache, getting from remote...`);

    // We don't have the object in cache, get from remote and cache it
    object = await this.remote.get<O>(hash);
    if (object) {
      this.logger.info(`Got object with hash ${hash} from remote: ${object}`);
      await this.cache.cache<O>(hash, object);
    }

    return object;
  }
}
