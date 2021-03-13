import { CASStore } from '../../../cas/interfaces/cas-store';
import { Client } from '../../../evees/interfaces/client';

import { ClientCachedWithBase } from '../client.cached.with.base';
import { CacheLocal } from './cache.local';

export class ClientLocal extends ClientCachedWithBase {
  constructor(
    public store: CASStore,
    protected base?: Client,
    readonly name: string = 'LocalClient'
  ) {
    super(store, new CacheLocal(name, store), base, name);
  }
}
