import EventEmitter from 'events';

import { Evees } from '../../../evees/evees.service';
import { Logger } from '../../../utils/logger';
import { CASStore } from '../../../cas/interfaces/cas-store';
import { Secured } from '../../../cas/utils/cid-hash';
import { ClientEvents } from '../../../evees/interfaces/client';

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
import { EveesDB, PerspectiveLocal } from './remote.local.db';
import { LocalSearchEngine } from './search.engine.local';

class LocalAccessControl implements AccessControl {
  async canUpdate(uref: string, userId?: string) {
    return true;
  }
}

/** use local storage to sotre  */
export class RemoteEveesLocal implements RemoteEvees {
  logger = new Logger('RemoteEveesLocal');
  accessControl: AccessControl = new LocalAccessControl();
  store!: CASStore;
  searchEngine: LocalSearchEngine;
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

  setEvees(evees: Evees) {
    this.searchEngine.setEvees(evees);
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
    if (mutation.newPerspectives) {
      await Promise.all(
        mutation.newPerspectives.map((newPerspective) => this.newPerspective(newPerspective))
      );
    }

    if (mutation.updates) {
      await Promise.all(mutation.updates.map((update) => this.updatePerspective(update)));
    }

    // /** after all mutations, update the ecosystems of the changed children */
    // const newUpdates = mutation.newPerspectives
    //   ? mutation.newPerspectives.map((np) => np.update)
    //   : [];
    // const updates = mutation.updates ? mutation.updates : [];
    // const allUpdates = newUpdates.concat(updates);

    // await Promise.all(
    //   allUpdates.map(async (update) => {
    //     if (update.linkChanges && update.linkChanges.children) {
    //       /** update ecosystem links */
    //       return this.updateEcosystem(update.perspectiveId, update.linkChanges.children);
    //     }
    //     return Promise.resolve();
    //   })
    // );

    /** emit the perspectives updated */
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
      // ecosystem: [newPerspective.perspective.id],
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

    const newPerspectiveLocal: PerspectiveLocal = {
      ...perspective,
      details: details,
      children: newChildren,
      linksTo: newLinksTo,
      text: newText,
    };

    this.logger.log('updatePerspective()', newPerspectiveLocal);

    await this.db.perspectives.put(newPerspectiveLocal);
  }

  // // placeholder function not used now
  // async updateEcosystem(perspectiveId: string, children: { added: string[]; removed: string[] }) {
  //   const reverseEcosystem = await this.db.perspectives
  //     .where('ecosystem')
  //     .equals(perspectiveId)
  //     .distinct()
  //     .primaryKeys();

  //   const updateAdded = children.added.map(
  //     async (childId): Promise<void> => {
  //       const child = await this.db.perspectives.get(childId);

  //       if (!child || !child.ecosystem || child.ecosystem.length === 0) {
  //         return;
  //       }

  //       const childEcosytem = child.ecosystem;

  //       await Promise.all(
  //         reverseEcosystem.map((parentId) => this.mutateEcosystem(parentId, childEcosytem, true))
  //       );
  //     }
  //   );

  //   const updateRemoved = children.removed.map(
  //     async (childId): Promise<void> => {
  //       const child = await this.db.perspectives.get(childId);

  //       if (!child || !child.ecosystem || child.ecosystem.length === 0) {
  //         return;
  //       }

  //       const childEcosytem = child.ecosystem;

  //       await Promise.all(
  //         reverseEcosystem.map((parentId) => this.mutateEcosystem(parentId, childEcosytem, false))
  //       );
  //     }
  //   );

  //   return Promise.all([updateAdded, updateRemoved]);
  // }

  // async mutateEcosystem(perspectiveId: string, elements: string[], add: boolean) {
  //   const perspective = await this.db.perspectives.get(perspectiveId);
  //   if (!perspective) throw new Error(`Perspective not found locally ${perspectiveId}`);

  //   const currentEcoystem = perspective.ecosystem ? perspective.ecosystem : [];

  //   if (add) {
  //     perspective.ecosystem = currentEcoystem.concat(elements);
  //   } else {
  //     perspective.ecosystem = currentEcoystem.filter((e) => !elements.includes(e));
  //   }

  //   /** set the values on the DB */
  //   this.logger.log('mutateEcosystem()', perspective);

  //   await this.db.perspectives.put(perspective);
  // }

  diff(): Promise<EveesMutation> {
    throw new Error('Method not implemented.');
  }

  flush(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  refresh(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async clear(): Promise<void> {
    await this.db.perspectives.clear();
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
