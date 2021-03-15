import { CASCache } from '../cas.cache';

import { Entity } from '../interfaces/entity';

export class CASCacheMemory implements CASCache {
  private newEntities = new Map<string, Entity>();
  private cachedEntities = new Map<string, Entity>();

  async getCachedEntity(hash: string): Promise<Entity | undefined> {
    return this.cachedEntities.get(hash);
  }
  async getNewEntity(hash: string): Promise<Entity | undefined> {
    return this.newEntities.get(hash);
  }
  async cacheEntity(entity: Entity<any>): Promise<void> {
    this.cachedEntities.set(entity.id, entity);
  }
  async putEntity(entity: Entity<any>): Promise<void> {
    this.newEntities.set(entity.id, entity);
  }
  async removeEntity(hash: string) {
    this.newEntities.delete(hash);
  }
  async diff(): Promise<Entity[]> {
    return Array.from(this.newEntities.values());
  }
  async clear(): Promise<void> {
    this.newEntities.clear();
  }
}
