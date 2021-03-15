import { CASStore } from 'src/cas/interfaces/cas-store';
import { Signed } from 'src/patterns/interfaces/signable';
import { Logger } from '../../../utils/logger';
import { NewPerspective, Update, EveesMutation, Perspective } from '../../interfaces/types';
import { CachedDetails, ClientCache } from '../client.cache';
import { EveesDB } from './cache.local.db';

/** use local storage to sotre  */
export class CacheLocal implements ClientCache {
  logger = new Logger('CacheLocal');

  db: EveesDB;

  constructor(name: string, protected store: CASStore) {
    this.db = new EveesDB(name);
  }

  async clearCachedPerspective(perspectiveId: string): Promise<void> {
    if (this.db.perspectives.get(perspectiveId) !== undefined) {
      await this.db.perspectives.delete(perspectiveId);
    }
  }

  async getCachedPerspective(perspectiveId: string): Promise<CachedDetails | undefined> {
    return this.db.perspectives.get(perspectiveId);
  }

  async setCachedPerspective(perspectiveId: string, details: CachedDetails): Promise<void> {
    const perspective = await this.store.getEntity<Signed<Perspective>>(perspectiveId);

    await this.db.perspectives.put({
      id: perspectiveId,
      details: details.details,
      levels: details.levels,
      context: perspective.object.payload.context,
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
}
