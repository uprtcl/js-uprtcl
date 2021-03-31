import { IndexDataHelper } from 'src/evees/index.data.helper';
import { CASStore } from '../../../cas/interfaces/cas-store';
import { Signed } from '../../../patterns/interfaces/signable';
import { Logger } from '../../../utils/logger';
import {
  NewPerspective,
  Update,
  EveesMutation,
  Perspective,
  Slice,
  Commit,
} from '../../interfaces/types';
import { CachedUpdate, ClientCache } from '../client.cache';
import { EveesCacheDB } from './cache.local.db';

/** use local storage as cache of ClientCachedWithBase */
export class CacheLocal implements ClientCache {
  logger = new Logger('CacheLocal');

  readonly db: EveesCacheDB;

  constructor(name: string, protected store?: CASStore) {
    this.db = new EveesCacheDB(name);
  }

  setStore(store: CASStore) {
    this.store = store;
  }

  async clearCachedPerspective(perspectiveId: string): Promise<void> {
    if (this.db.perspectives.get(perspectiveId) !== undefined) {
      await this.db.perspectives.delete(perspectiveId);
    }
  }

  async getCachedPerspective(perspectiveId: string): Promise<CachedUpdate | undefined> {
    const localPerspective = await this.db.perspectives.get(perspectiveId);
    if (!localPerspective) return undefined;

    return {
      update: {
        perspectiveId: perspectiveId,
        details: localPerspective.details,
      },
      levels: 0,
    };
  }

  async setCachedPerspective(perspectiveId: string, cachedUpdate: CachedUpdate): Promise<void> {
    if (!this.store) throw new Error('store undefined');
    const perspective = await this.store.getEntity<Signed<Perspective>>(perspectiveId);

    const current = await this.db.perspectives.get(perspectiveId);

    const addedOnEcosystem = IndexDataHelper.getAddedOnEcosystem(cachedUpdate.update.indexData);
    const addedChildren = IndexDataHelper.getAddedChildren(cachedUpdate.update.indexData);

    const currentOnEcosystem = current ? (current.onEcosystem ? current.onEcosystem : []) : [];
    const currentChildren = current ? (current.children ? current.children : []) : [];

    const newOnEcosystem = currentOnEcosystem.concat(
      addedOnEcosystem.filter((e) => !currentOnEcosystem.includes(e))
    );

    const newChildren = currentOnEcosystem.concat(
      addedOnEcosystem.filter((e) => !currentOnEcosystem.includes(e))
    );

    let dataId: string | undefined = undefined;

    if (cachedUpdate.update.details.headId) {
      if (!this.store) throw new Error('store undefined');
      const head = await this.store.getEntity<Signed<Commit>>(cachedUpdate.update.details.headId);
      dataId = head.object.payload.dataId;
    }

    await this.db.perspectives.put({
      id: perspectiveId,
      details: cachedUpdate.update.details,
      levels: cachedUpdate.levels,
      context: perspective.object.payload.context,
      onEcosystem: newOnEcosystem,
      children: newChildren,
      dataId,
    });
  }

  async newPerspective(newPerspective: NewPerspective): Promise<void> {
    let dataId: string | undefined = undefined;

    if (newPerspective.update.details.headId) {
      if (!this.store) throw new Error('store undefined');
      const head = await this.store.getEntity<Signed<Commit>>(newPerspective.update.details.headId);
      dataId = head.object.payload.dataId;
    }

    await this.db.newPerspectives.put({
      id: newPerspective.perspective.id,
      newPerspective,
      dataId,
    });
  }

  async addUpdate(update: Update, timestamp: number): Promise<void> {
    let dataId: string | undefined = undefined;

    if (update.details.headId) {
      if (!this.store) throw new Error('store undefined');
      const head = await this.store.getEntity<Signed<Commit>>(update.details.headId);
      dataId = head.object.payload.dataId;
    }

    await this.db.updates.put({
      id: update.perspectiveId + update.details.headId,
      perspectiveId: update.perspectiveId,
      timextamp: timestamp,
      update,
      dataId,
    });
  }

  async deletedPerspective(perspectiveId: string) {
    await this.db.deletedPerspectives.put(perspectiveId);
  }

  async deleteNewPerspective(perspectiveId: string) {
    if ((await this.db.newPerspectives.get(perspectiveId)) !== undefined) {
      return this.db.newPerspectives.delete(perspectiveId);
    }
  }

  async getNewPerspectives(): Promise<NewPerspective[]> {
    const elements = await this.db.newPerspectives.toArray();
    return elements.map((e) => e.newPerspective);
  }

  async getUpdates(): Promise<Update[]> {
    const elements = await this.db.updates.toArray();
    return elements.map((e) => e.update);
  }

  async getDeletedPerspective(): Promise<string[]> {
    const elements = await this.db.deletedPerspectives.toArray();
    return elements;
  }

  async diff(): Promise<EveesMutation> {
    return {
      newPerspectives: await this.getNewPerspectives(),
      updates: await this.getUpdates(),
      deletedPerspectives: await this.getDeletedPerspective(),
      entities: [],
    };
  }

  /** clear the cache and the entities in the store associated to the provided
   * perspecties */
  async clearPerspective(perspectiveId: string): Promise<void> {
    const clearUpdates: Update[] = [];

    const newPerspective = await this.db.newPerspectives.get(perspectiveId);
    if (newPerspective) {
      await this.db.newPerspectives.delete(perspectiveId);
      await this.db.perspectives.delete(perspectiveId);
      clearUpdates.push(newPerspective.newPerspective.update);
    }

    const updatesLocal = await this.db.updates
      .where('perspectiveId')
      .equals(perspectiveId)
      .toArray();

    await Promise.all(
      updatesLocal.map(async (updateLocal) => {
        await this.db.updates.delete(updateLocal.id);
        await this.db.perspectives.delete(updateLocal.id);
        clearUpdates.push(updateLocal.update);
      })
    );

    const clearEntitiesIfOrphan: string[] = [];
    const clearEntities: string[] = [];

    await Promise.all(
      clearUpdates.map(async (update) => {
        if (update.details.headId) {
          clearEntities.push(update.details.headId);
          if (!this.store) throw new Error('store undefined');
          const head = await this.store.getEntity<Signed<Commit>>(update.details.headId);
          /** data should be removed if there are no other commits using it :/ */
          clearEntitiesIfOrphan.push(head.object.payload.dataId);
        }
      })
    );

    /** now that all newPerspectives and updates are removed, see if clearIfOrphan can be deleted */
    await Promise.all(
      clearEntitiesIfOrphan.map(async (id) => {
        const onNewPerspectives = await this.db.newPerspectives
          .where('dataId')
          .equals(id)
          .primaryKeys();
        const onUpdates = await this.db.updates.where('dataId').equals(id).primaryKeys();
        const onCachedPerspectives = await this.db.perspectives
          .where('dataId')
          .equals(id)
          .primaryKeys();

        if (
          onNewPerspectives.length === 0 &&
          onUpdates.length === 0 &&
          onCachedPerspectives.length === 0
        ) {
          clearEntities.push(id);
        }
      })
    );

    /** removeEntities from the store */
    if (!this.store) throw new Error('store undefined');
    await this.store.removeEntities(clearEntities);
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.db.newPerspectives.clear(),
      this.db.updates.clear(),
      this.db.deletedPerspectives.clear(),
      this.db.perspectives.clear(),
    ]);
  }

  async clearSlice(slice: Slice): Promise<void> {}

  async getUnder(uref: string): Promise<string[]> {
    return this.db.perspectives.where('onEcosystem').equals(uref).primaryKeys();
  }

  async getOnEcosystems(perspectiveId: string): Promise<string[]> {
    const perspective = await this.db.perspectives.get(perspectiveId);
    return perspective && perspective.onEcosystem ? perspective.onEcosystem : [];
  }

  async getNewPerspective(perspectiveId: string): Promise<NewPerspective | undefined> {
    const newPerspectiveLocal = await this.db.newPerspectives.get(perspectiveId);
    if (!newPerspectiveLocal) return undefined;
    return newPerspectiveLocal.newPerspective;
  }

  async getLastUpdate(perspectiveId: string): Promise<Update | undefined> {
    const updates = await this.db.updates
      .where('perspectiveId')
      .equals(perspectiveId)
      .sortBy('timexstamp');

    const last = updates.pop();
    if (!last) {
      return undefined;
    }

    return last.update;
  }
}
