import { ClientAndExplore } from '../../interfaces';
import { ExploreCachedBase } from '../explore/client.explore.base';
import { ExploreCacheStoreMemory } from './explore.cache.store.memory';

export class ExploreCachedOnMemory extends ExploreCachedBase {
  constructor(base: ClientAndExplore) {
    super(base, new ExploreCacheStoreMemory());
  }
}
