import { ClientCacheStore } from '../../interfaces/client.cache.store';
import { CachedUpdate } from '../../interfaces/client.mutation.store';
import { Entity } from '../../interfaces/entity';
import { CasCacheStoreMemory } from './cas.cache.store.memory';

export class ClientCacheStoreMemory extends CasCacheStoreMemory implements ClientCacheStore {
  /** A map from perspective id to head id, it holds the latest head of a perspective
   * known to this client, it might have come from the remote, or because the client knows
   * of an update to it */
  private cachedPerspectives = new Map<string, CachedUpdate>();

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
}
