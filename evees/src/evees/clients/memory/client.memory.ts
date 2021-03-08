import { EventEmitter } from 'events';

import {
  Update,
  NewPerspective,
  PerspectiveDetails,
  GetPerspectiveOptions,
  PerspectiveGetResult,
  EveesMutation,
  EveesMutationCreate,
} from '../../interfaces/types';
import { CASStore } from '../../../cas/interfaces/cas-store';
import { Entity, EntityCreate } from '../../../cas/interfaces/entity';

import { Client, ClientEvents } from '../../interfaces/client';

interface CachedDetails {
  details: PerspectiveDetails;
  levels?: number;
}

export class ClientOnMemory implements Client {
  /** a map with the new perspectives to be created */
  private newPerspectives = new Map<string, NewPerspective>();

  /** a map with the updates for each perspective. There might be more than on update ordered as they arrive */
  private updates = new Map<string, Update[]>();

  private deletedPerspectives = new Set<string>();

  /** TBD */
  private canUpdates = new Map<string, boolean>();
  private userPerspectives = new Map<string, string[]>();

  /** A map from perspective id to head id, it holds the latest head of a perspective
   * known to this client, it might have come from the remote, or because the client knows
   * of an update to it */
  private cachedPerspectives = new Map<string, CachedDetails>();

  /** A service to subsribe to udpate on perspectives */
  readonly events: EventEmitter;

  constructor(
    protected base: Client,
    public store: CASStore,
    readonly name: string = 'OnMemoryClient'
  ) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(1000);

    if (this.base.events) {
      this.base.events.on(ClientEvents.updated, (perspectiveIds: string[]) => {
        /** remove the cached perspectives if updated */
        perspectiveIds.forEach((id) => {
          if (this.cachedPerspectives.get(id) !== undefined) {
            this.cachedPerspectives.delete(id);
          }
        });

        this.events.emit(ClientEvents.updated, perspectiveIds);
      });
    }
  }

  get searchEngine() {
    return this.base.searchEngine;
  }

  get proposals() {
    return this.base.proposals;
  }

  async getPerspective(
    perspectiveId: string,
    options?: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult> {
    const cachedPerspective = this.cachedPerspectives.get(perspectiveId);
    if (cachedPerspective) {
      /** skip asking the base client only if we already search for the requested levels under
       * this perspective */
      if (!options || options.levels === undefined || options.levels === cachedPerspective.levels) {
        return { details: { ...cachedPerspective.details } };
      }
    }

    const result = await this.base.getPerspective(perspectiveId, options);

    /** cache result and slice */
    this.cachedPerspectives.set(perspectiveId, {
      details: result.details,
      levels: options ? options.levels : undefined,
    });

    if (result.slice) {
      /** entities are sent to the store to be cached there */
      await this.store.cacheEntities(result.slice.entities);

      result.slice.perspectives.forEach((perspectiveAndDetails) => {
        this.cachedPerspectives.set(perspectiveAndDetails.id, {
          details: perspectiveAndDetails.details,
          levels: options ? options.levels : undefined,
        });
      });
    }

    return { details: result.details };
  }
  async createPerspectives(newPerspectives: NewPerspective[]): Promise<void> {
    /** store perspective details */
    await Promise.all(
      newPerspectives.map(async (newPerspective) => {
        await this.store.storeEntity({
          object: newPerspective.perspective.object,
          remote: newPerspective.perspective.object.payload.remote,
        });
        this.newPerspectives.set(newPerspective.perspective.id, newPerspective);
        /** set the current known details of that perspective, can update is set to true */
        this.cachedPerspectives.set(newPerspective.perspective.id, {
          details: {
            ...newPerspective.update.details,
            canUpdate: true,
          },
          levels: -1, // new perspectives are assumed to be fully on the cache
        });
      })
    );
  }

  async updatePerspectives(updates: Update[]): Promise<void> {
    updates.forEach((update) => {
      const current = this.updates.get(update.perspectiveId) || [];
      this.updates.set(update.perspectiveId, current.concat([update]));

      /** update the cache with the new head (keep previous values if update does not
       * specify them)
       * TODO: what if the perpspective is not in the cache? */
      const cachedDetails: CachedDetails = this.cachedPerspectives.get(update.perspectiveId) || {
        details: {},
      };
      if (update.details.headId) {
        cachedDetails.details.headId = update.details.headId;
      }
      if (update.details.guardianId) {
        cachedDetails.details.guardianId = update.details.guardianId;
      }
    });

    this.events.emit(
      ClientEvents.updated,
      updates.map((u) => u.perspectiveId)
    );
  }

  async deletePerspectives(perspectiveIds: string[]): Promise<void> {
    /** store perspective details */
    await Promise.all(
      perspectiveIds.map(async (perspectiveId) => {
        this.deletedPerspectives.add(perspectiveId);
        /** set the current known details of that perspective, can update is set to true */

        if (this.newPerspectives.get(perspectiveId)) {
          this.newPerspectives.delete(perspectiveId);
        }

        if (this.cachedPerspectives.get(perspectiveId)) {
          this.cachedPerspectives.delete(perspectiveId);
        }
      })
    );
  }

  async update(mutation: EveesMutationCreate): Promise<void> {
    if (mutation.entities) {
      await this.store.storeEntities(mutation.entities);
    }

    if (mutation.newPerspectives) {
      await this.createPerspectives(mutation.newPerspectives);
    }

    if (mutation.updates) {
      await this.updatePerspectives(mutation.updates);
    }

    if (mutation.deletedPerspectives) {
      await this.deletePerspectives(mutation.deletedPerspectives);
    }
  }

  newPerspective(newPerspective: NewPerspective): Promise<void> {
    return this.update({ newPerspectives: [newPerspective] });
  }
  async deletePerspective(perspectiveId: string): Promise<void> {
    await this.update({ deletedPerspectives: [perspectiveId] });
  }
  updatePerspective(update: Update): Promise<void> {
    return this.update({ updates: [update] });
  }

  async hashEntities(entities: EntityCreate[]): Promise<Entity[]> {
    return this.store.hashEntities(entities);
  }

  async flush(): Promise<void> {
    await this.store.flush();

    const newPerspectives = Array.from(this.newPerspectives.values());
    const updates = Array.prototype.concat.apply([], Array.from(this.updates.values()));
    const deletedPerspectives = Array.from(this.deletedPerspectives.values());

    await this.base.update({
      newPerspectives,
      updates,
      deletedPerspectives,
    });

    await this.base.flush();

    await this.clear();
  }

  async clear(): Promise<void> {
    this.newPerspectives.clear();
    this.updates.clear();
    this.deletedPerspectives.clear();
  }

  async canUpdate(userId: string, perspectiveId: string): Promise<boolean> {
    const canUpdate = this.canUpdates.get(perspectiveId);
    if (canUpdate !== undefined) {
      return canUpdate;
    }

    return this.base.canUpdate(userId, perspectiveId);
  }

  /** a mutation with all the changes made relative to the base client */
  async diff(): Promise<EveesMutation> {
    return {
      newPerspectives: Array.from(this.newPerspectives.values()),
      updates: Array.prototype.concat.apply([], [...Array.from(this.updates.values())]),
      deletedPerspectives: Array.from(this.deletedPerspectives.values()),
      entities: await this.store.diff(),
    };
  }

  /** it gets the logged user perspectives (base layers are user aware) */
  async getUserPerspectives(perspectiveId: string): Promise<string[]> {
    let perspectives = this.userPerspectives.get(perspectiveId);
    if (perspectives === undefined) {
      perspectives = await this.base.getUserPerspectives(perspectiveId);
      this.userPerspectives.set(perspectiveId, perspectives as string[]);
    }
    return perspectives ? perspectives : [];
  }

  async refresh(): Promise<void> {}
}
