import { CASStore } from '../../../cas/interfaces/cas-store';
import { CASLocal } from '../../../cas/stores/cas.local';
import { Logger } from '../../../utils/logger';

import { Client } from '../../interfaces/client';
import { ClientCachedBase } from '../cached/client.cached.base';

import { CacheLocal } from './cache.local';

const LOGINFO = false;

export class ClientCachedLocal extends ClientCachedBase {
  logger = new Logger('ClientCachedLocal');

  constructor(
    store?: CASStore,
    readonly base?: Client,
    readonly readCacheEnabled: boolean = true,
    readonly name: string = 'local'
  ) {
    super(base, `${name}-client`, readCacheEnabled);

    if (store) {
      this.store = store;
    } else {
      if (this.base) {
        this.store = new CASLocal('local', this.base.store, false);
      }
    }

    this.cache = new CacheLocal(name, this.store);
  }

  /** retype cache as CacheLocal */
  get cacheLocal() {
    return this.cache as CacheLocal;
  }

  get searchEngine() {
    return this.base ? this.base.searchEngine : undefined;
  }

  setStore(store: CASStore) {
    this.store = store;
    (this.cache as CacheLocal).setStore(store);
  }
}
