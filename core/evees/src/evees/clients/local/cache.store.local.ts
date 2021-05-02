import { IndexDataHelper } from '../../index.data.helper';
import { ClientCacheStore } from '../../interfaces/client.cache.store';
import { CachedUpdate } from '../../interfaces/client.mutation.store';
import { Entity } from '../../interfaces/entity';
import { LinksType } from '../../interfaces/types';
import { CacheStoreDB } from './cache.store.local.db';

export class ClientCacheStoreLocal implements ClientCacheStore {
  db: CacheStoreDB;

  constructor(name: string) {
    this.db = new CacheStoreDB(name);
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
    const current = await this.db.perspectives.get(perspectiveId);

    const onEcosystemChanges = IndexDataHelper.getArrayChanges(
      cachedUpdate.update.indexData,
      LinksType.onEcosystem
    );

    const currentOnEcosystem = current ? (current.onEcosystem ? current.onEcosystem : []) : [];

    const newOnEcosystem = currentOnEcosystem.concat(
      onEcosystemChanges.added.filter((e) => !currentOnEcosystem.includes(e))
    );

    await this.db.perspectives.put({
      id: perspectiveId,
      details: cachedUpdate.update.details,
      levels: cachedUpdate.levels,
      onEcosystem: newOnEcosystem,
    });
  }

  clearCachedEntity(entityId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getCachedEntity(entityId: string): Promise<Entity<any> | undefined> {
    throw new Error('Method not implemented.');
  }
  setCachedEntity(entity: Entity<any>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  setCachedEntities(entities: Entity<any>[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
