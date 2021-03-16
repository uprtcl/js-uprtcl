import { CASStore } from 'src/cas/interfaces/cas-store';
import { Signed } from 'src/patterns/interfaces/signable';
import { Logger } from '../../../utils/logger';
import { NewPerspective, Update, EveesMutation, Perspective } from '../../interfaces/types';
import { CachedUpdate, ClientCache } from '../client.cache';
import { EveesCacheDB } from './cache.local.db';

/** use local storage to sotre  */
export class CacheLocal implements ClientCache {
  logger = new Logger('CacheLocal');

  db: EveesCacheDB;

  constructor(name: string, protected store: CASStore) {
    this.db = new EveesCacheDB(name);
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
    const perspective = await this.store.getEntity<Signed<Perspective>>(perspectiveId);

    /** use the linkTo entry to mark a perspective of a given ecoystem */
    const onEcosystem =
      cachedUpdate.update.linkChanges &&
      cachedUpdate.update.linkChanges.linksTo &&
      cachedUpdate.update.linkChanges.linksTo.added.length > 0
        ? cachedUpdate.update.linkChanges.linksTo.added[0]
        : undefined;

    await this.db.perspectives.put({
      id: perspectiveId,
      details: cachedUpdate.update.details,
      levels: cachedUpdate.levels,
      context: perspective.object.payload.context,
      onEcosystem,
    });
  }

  async newPerspective(newPerspective: NewPerspective): Promise<void> {
    await this.db.newPerspectives.put({
      id: newPerspective.perspective.id,
      newPerspective,
    });
  }

  async addUpdate(update: Update): Promise<void> {
    await this.db.updates.put({
      id: update.perspectiveId,
      update,
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

  async clear(): Promise<void> {
    await Promise.all([
      this.db.newPerspectives.clear(),
      this.db.updates.clear(),
      this.db.deletedPerspectives.clear(),
      this.db.perspectives.clear(),
    ]);
  }

  async getOnEcosystem(uref: string): Promise<string[]> {
    return this.db.perspectives.where('onEcosystem').equals(uref).primaryKeys();
  }

  async getNewPerspective(uref: string): Promise<NewPerspective | undefined> {
    const newPerspectiveLocal = await this.db.newPerspectives.get(uref);
    if (!newPerspectiveLocal) return undefined;
    return newPerspectiveLocal.newPerspective;
  }
}
