import { Evees } from '../../../evees/evees.service';
import { Logger } from '../../../utils/logger';
import { CASStore } from '../../../cas/interfaces/cas-store';
import { Secured } from '../../../cas/utils/cid-hash';
import { Client } from '../../../evees/interfaces/client';

import { snapDefaultPerspective } from '../../default.perspectives';
import { AccessControl } from '../../interfaces/access-control';
import { RemoteEvees } from '../../interfaces/remote.evees';
import { PartialPerspective, Perspective } from '../../interfaces/types';
import { LocalSearchEngine } from './search.engine.local';
import { ClientCachedLocal } from './client.cached.local';
import { CacheLocal } from './cache.local';

class LocalAccessControl implements AccessControl {
  async canUpdate(uref: string, userId?: string) {
    return true;
  }
}

/** use local storage to sotre  */
export class RemoteEveesLocal extends ClientCachedLocal implements RemoteEvees {
  logger = new Logger('RemoteEveesLocal');
  accessControl: AccessControl = new LocalAccessControl();
  store!: CASStore;
  searchEngineLocal!: LocalSearchEngine;

  get userId() {
    return 'local';
  }

  get id() {
    return 'local';
  }

  get defaultPath() {
    return '';
  }

  constructor(store: CASStore, readonly casID: string, base?: Client) {
    super(store, base, false, 'remote');
    this.searchEngineLocal = new LocalSearchEngine((this.cache as CacheLocal).db);
  }

  get searchEngine() {
    return this.searchEngineLocal;
  }

  setStore(store: CASStore) {
    this.store = store;
  }

  setEvees(evees: Evees) {
    this.searchEngine.setEvees(evees);
  }

  snapPerspective(
    perspective: PartialPerspective,
    guardianId?: string
  ): Promise<Secured<Perspective>> {
    return snapDefaultPerspective(this, perspective);
  }

  async ready(): Promise<void> {}
  async connect(): Promise<void> {}
  async isConnected() {
    return true;
  }
  async disconnect() {}
  async isLogged(): Promise<boolean> {
    return true;
  }
  async login() {}
  async logout() {}
}
