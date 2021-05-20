import {
  Update,
  NewPerspective,
  EveesMutation,
  PerspectiveDetails,
  SearchOptions,
  LinksType,
} from '../../interfaces/types';
import { ClientMutationStore } from '../../interfaces/client.mutation.store';
import { IndexDataHelper } from 'src/evees/index.data.helper';

/** info stored about the perspectives on the mutation that help fast
 * reading it's details or filtering the set of perspectives in the mutation */
interface PerspectiveMemory {
  details: PerspectiveDetails;
  onEcosystem: string[];
}

export class MutationStoreMemory implements ClientMutationStore {
  /** a map with the new perspectives to be created */
  private newPerspectives = new Map<string, NewPerspective>();
  /** a map with the updates for each perspective. There might be more than on update ordered as they arrive */
  private updates = new Map<string, Update[]>();
  private deletedPerspectives = new Set<string>();
  private newEntities = new Set<string>();

  /** keep the latest details cached for fast read */
  private perspectivesDetails = new Map<string, PerspectiveMemory>();

  async newPerspective(newPerspective: NewPerspective): Promise<void> {
    this.newPerspectives.set(newPerspective.perspective.hash, newPerspective);

    const onEcosystemChanges = IndexDataHelper.getArrayChanges(
      newPerspective.update.indexData,
      LinksType.onEcosystem
    );

    this.perspectivesDetails.set(newPerspective.perspective.hash, {
      details: newPerspective.update.details,
      onEcosystem: onEcosystemChanges.added,
    });
  }

  async addUpdate(update: Update): Promise<void> {
    const currentUpdates = this.updates.get(update.perspectiveId) || [];
    this.updates.set(update.perspectiveId, currentUpdates.concat([update]));

    /** update the details (append onEcosystem tags) */
    const currentDetails = this.perspectivesDetails.get(update.perspectiveId);
    let onEcosystem = currentDetails ? currentDetails.onEcosystem : [];

    if (
      update.indexData &&
      update.indexData.linkChanges &&
      update.indexData.linkChanges.onEcosystem
    ) {
      /** use function to remove existing values from ecosystme if in the
       * removed array of the update indexData */
      const newChanges = IndexDataHelper.appendArrayChanges(
        { added: onEcosystem, removed: [] },
        update.indexData.linkChanges.onEcosystem
      );

      onEcosystem = newChanges.added;
    }

    this.perspectivesDetails.set(update.perspectiveId, {
      details: update.details,
      onEcosystem,
    });
  }

  getUnder(perspectiveId: string): string[] {
    const matched = Array.from(this.perspectivesDetails.entries())
      .map(([id, perspective]) => {
        return perspective.onEcosystem.includes(perspectiveId) ? id : undefined;
      })
      .filter((id) => !!id);

    return matched as string[];
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

  async diff(options?: SearchOptions): Promise<EveesMutation> {
    let of: string[] = [];

    /** filter updates only to perspectives under a given element */
    if (options && options.under) {
      /**  */
      const allUnder = options.under.elements.map((under) => {
        return this.getUnder(under.id);
      });
      of = Array.prototype.concat.apply([], allUnder);
    }

    let newPerspectives = Array.from(this.newPerspectives.values());
    let updates = Array.prototype.concat.apply([], Array.from(this.updates.values())) as Update[];
    let deletedPerspectives = Array.from(this.deletedPerspectives.values());

    if (of.length > 0) {
      newPerspectives = newPerspectives.filter((np) => of.includes(np.perspective.hash));
      updates = updates.filter((up) => of.includes(up.perspectiveId));
      deletedPerspectives = deletedPerspectives.filter((id) => of.includes(id));
    }

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
    const perspective = this.perspectivesDetails.get(perspectiveId);
    if (perspective) {
      return { canUpdate: true, ...perspective.details };
    }
    return undefined;
  }
}
