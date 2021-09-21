import {
  Update,
  NewPerspective,
  EveesMutation,
  PerspectiveDetails,
  SearchOptions,
  ClientMutationStore,
} from '../../interfaces';
import { MutationHelper } from '../../utils';

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

  /** keep the latest details cached for fast read */
  private perspectivesDetails = new Map<string, PerspectiveMemory>();

  async newPerspective(newPerspective: NewPerspective): Promise<void> {
    this.newPerspectives.set(newPerspective.perspective.hash, newPerspective);

    const onEcosystem = newPerspective.update.indexData
      ? newPerspective.update.indexData.onEcosystem
        ? newPerspective.update.indexData.onEcosystem
        : []
      : [];

    this.perspectivesDetails.set(newPerspective.perspective.hash, {
      details: newPerspective.update.details,
      onEcosystem: onEcosystem,
    });
  }

  async addUpdate(update: Update): Promise<void> {
    const currentUpdates = this.updates.get(update.perspectiveId) || [];
    this.updates.set(update.perspectiveId, currentUpdates.concat([update]));

    /** update the details (append onEcosystem tags) */
    const onEcosystem = update.indexData
      ? update.indexData.onEcosystem
        ? update.indexData.onEcosystem
        : []
      : [];

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
    if (options && options.start) {
      /**  */
      const allUnder = options.start.elements.map((under) => {
        if (under.direction === 'above') throw new Error('Cant filter above');
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

  async clear(elements?: EveesMutation): Promise<void> {
    if (elements) {
      elements.newPerspectives.forEach((np) => this.newPerspectives.delete(np.perspective.hash));

      /** remove all the updates in the elements mutation from the updates in memory */
      const updatesPerPersective = MutationHelper.getUpdatesPerPerspective(elements);
      Array.from(updatesPerPersective.entries()).forEach(([perspectiveId, clearUpdates]) => {
        const currentUpdates = this.updates.get(perspectiveId);
        if (currentUpdates) {
          // delete updates that set the head to the heads in the clear `elements` array
          const newUpdates = currentUpdates.filter((current) =>
            clearUpdates.filter(
              (clear) =>
                clear.details.headId !== undefined &&
                clear.details.headId === current.details.headId
            )
          );

          if (newUpdates.length > 0) {
            this.updates.set(perspectiveId, newUpdates);
          } else {
            this.updates.delete(perspectiveId);
          }
        }
      });

      elements.deletedPerspectives.forEach((id) => this.deletedPerspectives.delete(id));
    } else {
      this.newPerspectives.clear();
      this.updates.clear();
      this.deletedPerspectives.clear();
      this.perspectivesDetails.clear();
    }
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
