import { Logger } from '../../../utils/logger';
import { CASStore } from '../../../cas/interfaces/cas-store';
import { Client } from '../../interfaces/client';
import { LinksType } from '../../interfaces/types';
import { IndexDataHelper } from '../../index.data.helper';

import { ClientCachedWithBase } from '../client.cached.with.base';
import { CacheOnMemory } from './cache.memory';

export class ClientOnMemory extends ClientCachedWithBase {
  logger = new Logger('ClientOnMemory');
  store: CASStore;

  constructor(readonly base: Client, store?: CASStore, readonly name: string = 'OnMemoryClient') {
    super(base, name);
    this.store = store || base.store;
    this.cache = new CacheOnMemory();
  }

  async addOnEcosystem(onEcosystem: string[]) {
    const updates = await this.cache.getUpdates();
    updates.map((update) => {
      IndexDataHelper.combineArrayChanges(
        { added: onEcosystem, removed: [] },
        LinksType.onEcosystem,
        update.indexData
      );
    });

    const perspectives = await this.cache.getNewPerspectives();
    perspectives.map((newPerspective) => {
      IndexDataHelper.combineArrayChanges(
        { added: onEcosystem, removed: [] },
        LinksType.onEcosystem,
        newPerspective.update.indexData
      );
    });
  }
}
