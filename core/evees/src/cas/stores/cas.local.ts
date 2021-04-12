import { CASCachedWithBase } from '../cas.cached.with.base';

import { CASStore } from '../interfaces/cas-store';
import { CASCacheLocal } from './cas.cache.local';

export class CASLocal extends CASCachedWithBase {
  constructor(name: string = 'cas-local', protected base?: CASStore, cacheEnabled: boolean = true) {
    super(new CASCacheLocal(name), base, cacheEnabled);
  }
}
