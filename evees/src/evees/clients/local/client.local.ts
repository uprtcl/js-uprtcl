import EventEmitter from 'events';

import { SearchEngine } from '../../../evees/interfaces/search.engine';
import { Proposals } from '../../../evees/proposals/proposals';
import { Logger } from '../../../utils/logger';
import { CASStore } from '../../../cas/interfaces/cas-store';
import { Client, ClientEvents } from '../../interfaces/client';

import {
  GetPerspectiveOptions,
  PerspectiveGetResult,
  EveesMutationCreate,
  NewPerspective,
  Update,
  EveesMutation,
  PerspectiveDetails,
  Perspective,
} from '../../interfaces/types';
import { EveesDB, PerspectiveLocal } from './client.local.db';
import { Signed } from 'src/patterns/interfaces/signable';

/** use local storage to sotre  */
export class ClientLocal implements Client {
  logger = new Logger('EveesLocal');

  db: EveesDB;
  events: EventEmitter;
  searchEngine!: SearchEngine;
  proposals!: Proposals;
  store!: CASStore;

  constructor(dbId: string = 'client-local', store: CASStore, protected base?: Client) {
    this.store = store;
    this.db = new EveesDB(dbId);
    this.events = new EventEmitter();
    this.events.setMaxListeners(1000);

    if (this.base && this.base.events) {
      this.base.events.on(ClientEvents.updated, async (perspectiveIds: string[]) => {
        /** remove the cached perspectives if updated */
        perspectiveIds.forEach(async (id) => {
          if ((await this.db.perspectives.get(id)) !== undefined) {
            this.db.perspectives.delete(id);
          }
        });

        this.events.emit(ClientEvents.updated, perspectiveIds);
      });
    }
  }

  async getPerspective(
    perspectiveId: string,
    options?: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult> {
    const perspectiveLocal = await this.db.perspectives.get(perspectiveId);

    if (perspectiveLocal) {
      const details = perspectiveLocal ? perspectiveLocal.details : {};
      details.canUpdate = true;
      return { details };
    }

    if (!this.base) {
      return { details: {} };
    }

    const result = await this.base.getPerspective(perspectiveId, options);

    const perspective = await this.store.getEntity<Signed<Perspective>>(perspectiveId);

    /** cache result and slice */
    this.db.perspectives.put({
      id: perspectiveId,
      details: result.details,
      context: perspective.object.payload.context,
    });

    if (result.slice) {
      /** entities are sent to the store to be cached there */
      await this.store.cacheEntities(result.slice.entities);

      await Promise.all(
        result.slice.perspectives.map(async (perspectiveAndDetails) => {
          const thisPerspective = await this.store.getEntity<Signed<Perspective>>(
            perspectiveAndDetails.id
          );
          this.db.perspectives.put({
            id: thisPerspective.id,
            details: perspectiveAndDetails.details,
            context: thisPerspective.object.payload.context,
          });
        })
      );
    }

    return { details: result.details };
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
  }

  async flush(): Promise<void> {
    await this.store.flush();

    const newPerspectives = this.db.perspectives.;
    const updates = Array.prototype.concat.apply([], Array.from(this.updates.values()));
    const deletedPerspectives = Array.from(this.deletedPerspectives.values());

    await this.base.update({
      newPerspectives,
      updates,
      deletedPerspectives,
    });

    await this.base.flush();

    await this.clear();
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
}
