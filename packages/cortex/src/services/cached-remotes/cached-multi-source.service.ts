import { CachedMultiService } from './cached-multi.service';
import { CacheService } from '../cache/cache.service';
import { NamedSource } from '../sources/named.source';
import { MultiSourceService } from '../multi/multi-source.service';
import { Source } from '../sources/source';
import { Hashed } from '../../patterns/properties/hashable';

export class CachedMultiSourceService<CACHE extends CacheService, REMOTE extends NamedSource>
  extends CachedMultiService<CACHE, REMOTE, MultiSourceService<REMOTE>>
  implements Source {
  /**
   * Get the object identified by the given hash from cache or from remote
   * @param hash the hash identifying the object
   * @returns the object if found, undefined otherwise
   */
  public async get<O extends object>(hash: string): Promise<Hashed<O> | undefined> {
    // If we have the object in the cache, return it
    let object = await this.cache.get<O>(hash);
    if (object) {
      this.logger.info(`Object with hash ${hash} was in cache`, object);
      return object;
    }

    this.logger.info(`Object with hash ${hash} was not in cache, getting from remote...`);

    // We don't have the object in cache, get from remote and cache it
    object = await this.remote.get<O>(hash);

    if (object) {
      this.logger.info(`Got object with hash ${hash} from remote`, object);
      await this.cache.cache<Hashed<O>>(hash, object);
    }

    return object;
  }
}
