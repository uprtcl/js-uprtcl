import { CacheService } from './cache/cache.service';
import { MultiRemoteService } from './remotes/multi-remote.service';

export class DiscoveryService {
  constructor(cache: CacheService, multiRemote: MultiRemoteService) {}

  discover() {}
}
