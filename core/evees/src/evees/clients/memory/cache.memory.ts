import { Update, NewPerspective, EveesMutation } from '../../interfaces/types';
import { CachedUpdate, ClientCache } from '../../interfaces/client.cache';

export class CacheOnMemory implements ClientCache {
  /** a map with the new perspectives to be created */
  private newPerspectives = new Map<string, NewPerspective>();

  /** a map with the updates for each perspective. There might be more than on update ordered as they arrive */
  private updates = new Map<string, Update[]>();

  private deletedPerspectives = new Set<string>();

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

  async newPerspective(newPerspective: NewPerspective): Promise<void> {
    this.newPerspectives.set(newPerspective.perspective.id, newPerspective);
  }

  async addUpdate(update: Update): Promise<void> {
    const current = this.updates.get(update.perspectiveId) || [];
    this.updates.set(update.perspectiveId, current.concat([update]));
  }

  async deletedPerspective(perspectiveId: string) {
    this.deletedPerspectives.add(perspectiveId);
  }

  async deleteNewPerspective(perspectiveId: string) {
    if (this.newPerspectives.get(perspectiveId)) {
      this.newPerspectives.delete(perspectiveId);
    }
  }

  async getNewPerspectives(): Promise<NewPerspective[]> {
    return Array.from(this.newPerspectives.values());
  }

  async getUpdates(): Promise<Update[]> {
    return Array.prototype.concat.apply([], Array.from(this.updates.values()));
  }

  async getDeletedPerspective(): Promise<string[]> {
    return Array.from(this.deletedPerspectives.values());
  }

  async getNewPerspective(perspectiveId: string): Promise<NewPerspective | undefined> {
    return this.newPerspectives.get(perspectiveId);
  }

  async getUpdatesOf(perspectiveId: string): Promise<Update[]> {
    const updates = await this.getUpdates();
    /** assumed last in array is last */
    return updates.filter((u) => u.perspectiveId === perspectiveId);
  }

  async diff(): Promise<EveesMutation> {
    const newPerspectives = Array.from(this.newPerspectives.values());
    const updates = Array.prototype.concat.apply([], Array.from(this.updates.values()));
    const deletedPerspectives = Array.from(this.deletedPerspectives.values());

    return {
      newPerspectives,
      updates,
      deletedPerspectives,
      entities: [],
    };
  }

  async clear(): Promise<void> {
    this.newPerspectives.clear();
    this.updates.clear();
    this.deletedPerspectives.clear();
  }

  storeEntity(entity: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getDeletedPerspectives(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  clearPerspective(perspectiveId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
