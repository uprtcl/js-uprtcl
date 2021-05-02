import { ClientCacheStore } from '../../interfaces/client.cache.store';
import { CachedUpdate } from '../../interfaces/client.mutation.store';
import { Entity } from '../../interfaces/entity';

export class ClientCacheStoreMemory implements ClientCacheStore {
  /** A map from perspective id to head id, it holds the latest head of a perspective
   * known to this client, it might have come from the remote, or because the client knows
   * of an update to it */
  private cachedPerspectives = new Map<string, CachedUpdate>();
  private cachedEntities = new Map<string, Entity>();

  async clearCachedPerspective(perspectiveId: string): Promise<void> {
    if (this.cachedPerspectives.get(perspectiveId)) {
      this.cachedPerspectives.delete(perspectiveId);
    }
  }

  async getCachedPerspective(perspectiveId: string): Promise<CachedUpdate | undefined> {
    return this.cachedPerspectives.get(perspectiveId);
  }

  async setCachedPerspective(perspectiveId: string, details: CachedUpdate): Promise<void> {
    this.cachedPerspectives.set(perspectiveId, details);
  }

  async clearCachedEntity(entityId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getCachedEntity(hash: string): Promise<Entity<any> | undefined> {
    return this.cachedEntities.get(hash);
  }
  async setCachedEntity(entity: Entity<any>): Promise<void> {
    this.cachedEntities.set(entity.hash, entity);
  }

  async setCachedEntities(entities: Entity<any>[]): Promise<void> {
    await Promise.all(entities.map((entity) => this.setCachedEntity(entity)));
  }
}
