import { Evees } from '../../../evees/evees.service';
import { Logger } from '../../../utils/logger';
import { CASStore } from '../../../cas/interfaces/cas-store';
import { Secured } from '../../../cas/utils/cid-hash';

import { snapDefaultPerspective } from '../../default.perspectives';
import { AccessControl } from '../../interfaces/access-control';
import { RemoteEvees } from '../../interfaces/remote.evees';
import { PartialPerspective, Perspective } from '../../interfaces/types';
import { LocalSearchEngine } from './search.engine.local';
import { ClientLocal } from './cache.local';
import { CASOnMemory } from 'src/cas/stores/cas.memory';

class LocalAccessControl implements AccessControl {
  async canUpdate(uref: string, userId?: string) {
    return true;
  }
}

/** use local storage to sotre  */
export class RemoteEveesLocal extends ClientLocal implements RemoteEvees {
  logger = new Logger('RemoteEveesLocal');
  accessControl: AccessControl = new LocalAccessControl();
  store!: CASStore;
  searchEngine: LocalSearchEngine;

  get userId() {
    return 'local';
  }

  get id() {
    return 'local';
  }

  get defaultPath() {
    return '';
  }

  constructor(readonly casID: string) {
    super('remote', new CASOnMemory());
    this.searchEngine = new LocalSearchEngine(this);
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
