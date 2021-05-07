import { Update, NewPerspective, EveesMutation, PerspectiveDetails } from '../../interfaces/types';
import { Entity } from '../../interfaces/entity';
import { ClientMutationStore } from '../../interfaces/client.mutation.store';

export class MutationStoreMemory implements ClientMutationStore {
  /** a map with the new perspectives to be created */
  private newPerspectives = new Map<string, NewPerspective>();
  /** a map with the updates for each perspective. There might be more than on update ordered as they arrive */
  private updates = new Map<string, Update[]>();
  private deletedPerspectives = new Set<string>();
  private newEntities = new Set<string>();

  /** keep the latest details cached for fast read */
  private perspectivesDetails = new Map<string, PerspectiveDetails>();

  async newPerspective(newPerspective: NewPerspective): Promise<void> {
    this.newPerspectives.set(newPerspective.perspective.hash, newPerspective);
    this.perspectivesDetails.set(newPerspective.perspective.hash, newPerspective.update.details);
  }

  async addUpdate(update: Update): Promise<void> {
    const current = this.updates.get(update.perspectiveId) || [];
    this.updates.set(update.perspectiveId, current.concat([update]));
    this.perspectivesDetails.set(update.perspectiveId, update.details);
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
    };
  }

  async clear(): Promise<void> {
    this.newPerspectives.clear();
    this.updates.clear();
    this.deletedPerspectives.clear();
  }

  async storeEntity(entityId: string): Promise<void> {
    this.newEntities.add(entityId);
  }

  async getDeletedPerspectives(): Promise<string[]> {
    return Array.from(this.deletedPerspectives.values());
  }

  clearPerspective(perspectiveId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getPerspective(perspectiveId: string): Promise<PerspectiveDetails | undefined> {
    return this.perspectivesDetails.get(perspectiveId);
  }
}
