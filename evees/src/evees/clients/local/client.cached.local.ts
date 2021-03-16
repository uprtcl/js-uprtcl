import { CASStore } from '../../../cas/interfaces/cas-store';
import { Client } from '../../interfaces/client';

import { ClientCachedWithBase } from '../client.cached.with.base';
import { CacheLocal } from './cache.local';

export class ClientCachedLocal extends ClientCachedWithBase {
  constructor(
    store: CASStore,
    protected base?: Client,
    cacheEnabled: boolean = true,
    readonly name: string = 'local'
  ) {
    super(new CacheLocal(name, store), store, base, `${name}-client`, cacheEnabled);
  }
}
