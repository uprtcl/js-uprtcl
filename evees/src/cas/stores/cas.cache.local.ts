import { CASCache } from '../cas.cache';
import { Entity } from '../interfaces/entity';
import { EntitiesDB } from './cas.local.db';

/** The CASLocal stores cas entities on IndexedDb */
export class CASCacheLocal implements CASCache {
  db: EntitiesDB;

  constructor(name: string) {
    this.db = new EntitiesDB(name);
  }

  async getCachedEntity(hash: string): Promise<Entity | undefined> {
    return this.db.entities.get(hash);
  }
  async getNewEntity(hash: string): Promise<Entity | undefined> {
    return this.db.newEntities.get(hash);
  }
  async cacheEntity(entity: Entity): Promise<void> {
    await this.db.entities.put(entity);
  }
  async putEntity(entity: Entity): Promise<void> {
    await this.db.newEntities.put(entity);
  }
  async diff(): Promise<Entity[]> {
    return this.db.newEntities.toArray();
  }
  async clear(): Promise<void> {
    return this.db.newEntities.clear();
  }
}
