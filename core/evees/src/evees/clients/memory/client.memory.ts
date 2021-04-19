import { Logger } from '../../../utils/logger';
import { CASStore } from '../../../cas/interfaces/cas-store';
import { Client } from '../../interfaces/client';
import { LinksType } from '../../interfaces/types';
import { IndexDataHelper } from '../../index.data.helper';

import { ClientCachedBase } from '../cached/client.cached.base';
import { CacheOnMemory } from './cache.memory';

export class ClientOnMemory extends ClientCachedBase {
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
