import { CASStore } from '../../../cas/interfaces/cas-store';
import { Client } from '../../../evees/interfaces/client';

import { ClientCachedWithBase } from '../client.cached.with.base';
import { CacheLocal } from './cache.local';

export class ClientLocal extends ClientCachedWithBase {
  constructor(
    store: CASStore,
    protected base?: Client,
    readonly name: string = 'local',
    cacheEnabled: boolean = true
  ) {
    super(new CacheLocal(name, store), store, base, `${name}-client`, cacheEnabled);
  }
}
