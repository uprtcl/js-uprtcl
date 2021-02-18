import { CASStore, Secured } from 'src/uprtcl-evees';
import { snapDefaultPerspective } from '../../default.perspectives';
import { AccessControl } from '../../interfaces/access-control';
import { RemoteEvees } from '../../interfaces/remote.evees';
import { SearchEngine } from '../../interfaces/search.engine';
import {
  PartialPerspective,
  Perspective,
  GetPerspectiveOptions,
  PerspectiveGetResult,
  EveesMutationCreate,
  NewPerspective,
  Update,
  EveesMutation,
  PerspectiveDetails,
} from '../../interfaces/types';
import { EveesDB } from './remote.local.db';
import { LocalSearchEngine } from './search.engine.local';

class LocalAccessControl implements AccessControl {
  async canUpdate(uref: string, userId?: string) {
    return true;
  }
}

/** use local storage to sotre  */
export class RemoteEveesLocal implements RemoteEvees {
  accessControl: AccessControl = new LocalAccessControl();
  store!: CASStore;
  searchEngine: SearchEngine;
  db: EveesDB;

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
    this.searchEngine = new LocalSearchEngine();
    this.db = new EveesDB();
  }

  setStore(store: CASStore) {
    this.store = store;
  }
  snapPerspective(
    perspective: PartialPerspective,
    guardianId?: string
  ): Promise<Secured<Perspective>> {
    return snapDefaultPerspective(this, perspective);
  }
  async getPerspective(
    perspectiveId: string,
    options?: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult> {
    const details = await this.db.perspectives.get(perspectiveId);
    return { details: details ? details : {} };
  }
  async update(mutation: EveesMutationCreate) {}
  async newPerspective(newPerspective: NewPerspective): Promise<void> {
    await this.db.perspectives.put(newPerspective.update.details, newPerspective.perspective.id);
  }
  async deletePerspective(perspectiveId: string): Promise<void> {
    await this.db.perspectives.delete(perspectiveId);
  }
  async updatePerspective(update: Update): Promise<void> {
    const currentDetails = await this.db.perspectives.get(update.perspectiveId);
    const details: PerspectiveDetails = {
      ...currentDetails,
      ...update.details,
    };
    await this.db.perspectives.put(details, update.perspectiveId);
  }
  diff(): Promise<EveesMutation> {
    throw new Error('Method not implemented.');
  }
  flush(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  refresh(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getUserPerspectives(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  async canUpdate(perspectiveId: string, userId?: string) {
    return true;
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
