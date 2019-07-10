import { CacheService } from './cache/cache.service';
import { MultiRemoteService } from './remotes/multi-remote.service';
import { Source } from './remotes/sources/source';
import { CachedRemote } from './remotes/cached.remote';

export class DiscoveryService<T extends Source, C extends CacheService & T> {
  cachedRemote: CachedRemote<T, C, MultiRemoteService<T>>;

  constructor(cache: C, multiRemote: MultiRemoteService<T>) {}

  discover() {}
}
