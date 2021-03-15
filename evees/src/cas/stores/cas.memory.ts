import { CASCachedWithBase } from '../cas.cached.with.base';

import { CASStore } from '../interfaces/cas-store';
import { CASCacheMemory } from './cas.cache.memory';

export class CASOnMemory extends CASCachedWithBase {
  constructor(protected base?: CASStore) {
    super(new CASCacheMemory());
  }
}
