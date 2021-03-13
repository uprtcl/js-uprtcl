import { CASStore } from '../../../cas/interfaces/cas-store';
import { Client } from '../../../evees/interfaces/client';

import { ClientCachedWithBase } from '../client.cached.with.base';
import { CacheOnMemory } from './cache.memory';

export class ClientOnMemory extends ClientCachedWithBase {
  constructor(
    protected base: Client,
    public store: CASStore,
    readonly name: string = 'OnMemoryClient'
  ) {
    super(base, store, new CacheOnMemory(), name);
  }
}
