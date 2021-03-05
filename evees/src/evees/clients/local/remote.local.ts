import EventEmitter from 'events';
import { ClientEvents } from 'src/evees/interfaces/client';
import { CASStore } from '../../../cas/interfaces/cas-store';
import { Secured } from '../../../cas/utils/cid-hash';

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
  LinkChanges,
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
  events: EventEmitter;

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
    this.searchEngine = new LocalSearchEngine(this);
    this.db = new EveesDB();
    this.events = new EventEmitter();
    this.events.setMaxListeners(1000);
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
    const perspectiveLocal = await this.db.perspectives.get(perspectiveId);
    const details = perspectiveLocal ? perspectiveLocal.details : {};
    details.canUpdate = true;
    return { details };
  }
  async update(mutation: EveesMutationCreate) {
    const create = mutation.newPerspectives
      ? Promise.all(
          mutation.newPerspectives.map((newPerspective) => this.newPerspective(newPerspective))
        )
      : Promise.resolve([]);
    const update = mutation.updates
      ? Promise.all(mutation.updates.map((update) => this.updatePerspective(update)))
      : Promise.resolve([]);

    await Promise.all([create, update]);

    if (mutation.updates && mutation.updates.length > 0) {
      this.events.emit(
        ClientEvents.updated,
        mutation.updates.map((u) => u.perspectiveId)
      );
    }
  }

  async newPerspective(newPerspective: NewPerspective): Promise<void> {
    await this.db.perspectives.put({
      id: newPerspective.perspective.id,
      context: newPerspective.perspective.object.payload.context,
      details: {},
    });

    return this.updatePerspective(newPerspective.update);
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    await this.db.perspectives.delete(perspectiveId);
  }

  async updatePerspective(update: Update): Promise<void> {
    const perspective = await this.db.perspectives.get(update.perspectiveId);
    if (!perspective) throw new Error(`Perspective not found locally ${update.perspectiveId}`);

    /** update details */
    const details: PerspectiveDetails = {
      ...perspective.details,
      ...update.details,
    };

    let newChildren = perspective.children ? perspective.children : [];
    if (update.linkChanges && update.linkChanges.children) {
      newChildren.push(...update.linkChanges.children.added);
      newChildren = newChildren.filter(
        (child) => !(update as any).linkChanges.children.removed.includes(child)
      );
    }

    let newLinksTo = perspective.linksTo ? perspective.linksTo : [];
    if (update.linkChanges && update.linkChanges.linksTo) {
      newLinksTo.push(...update.linkChanges.linksTo.added);
      newLinksTo = newLinksTo.filter(
        (link) => !(update as any).linkChanges.linksTo.removed.includes(link)
      );
    }

    const newText = update.text !== undefined ? update.text : perspective.text;

    await this.db.perspectives.put({
      id: update.perspectiveId,
      context: perspective.context,
      details: details,
      children: newChildren,
      linksTo: newLinksTo,
      text: newText,
    });

    if (update.linkChanges && update.linkChanges.children) {
      /** update ecosystem links */
      await this.updateEcosystem(update.perspectiveId, update.linkChanges.children);
    }
  }

  async updateEcosystem(perspectiveId: string, children: { added: string[]; removed: string[] }) {
    const perspective = await this.db.perspectives.get(perspectiveId);
    if (!perspective) throw new Error(`Perspective not found locally ${perspectiveId}`);

    children.added.map(
      async (childId): Promise<void> => {
        const child = await this.db.perspectives.get(childId);

        if (!child) {
          return;
        }

        /** append child ecosystem to the perspective and to all its reverese ecosystem */
        const newEcosystem = perspective.ecosystem ? perspective.ecosystem : [];
      }
    );
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
