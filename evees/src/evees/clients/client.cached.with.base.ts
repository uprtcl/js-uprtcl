import { EventEmitter } from 'events';

import {
  Update,
  NewPerspective,
  GetPerspectiveOptions,
  PerspectiveGetResult,
  EveesMutation,
  EveesMutationCreate,
  Commit,
  SearchOptions,
} from '../interfaces/types';
import { CASStore } from '../../cas/interfaces/cas-store';
import { Entity, EntityCreate } from '../../cas/interfaces/entity';

import { Client, ClientEvents } from '../interfaces/client';
import { ClientCache } from './client.cache';
import { Proposals } from '../proposals/proposals';
import { Signed } from 'src/patterns/interfaces/signable';
import { AsyncQueue } from 'src/utils/async';
import { SearchEngine } from '../interfaces/search.engine';

export class ClientCachedWithBase implements Client {
  /** A service to subsribe to udpate on perspectives */
  readonly events: EventEmitter;
  proposals?: Proposals | undefined;
  /** a search engine that will override that of the base layer is provided */
  searchEngineLocal?: SearchEngine;
  protected cache!: ClientCache;
  store!: CASStore;

  /** forces sequentiality between calls to update methods and
   * let readers wat for all updates to be processed */
  private updateQueue: AsyncQueue;

  constructor(
    readonly base?: Client,
    readonly name: string = 'client',
    readonly readCacheEnabled: boolean = true
  ) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(1000);
    this.updateQueue = new AsyncQueue();

    if (this.base && this.base.events) {
      this.base.events.on(ClientEvents.updated, (perspectiveIds: string[]) => {
        /** remove the cached perspectives if updated */
        perspectiveIds.forEach((id) => {
          this.cache.clearCachedPerspective(id);
        });

        this.events.emit(ClientEvents.updated, perspectiveIds);
      });
    }
  }

  get searchEngine() {
    if (this.searchEngineLocal) {
      return this.searchEngineLocal;
    }

    if (this.base) {
      return this.base.searchEngine;
    }

    return undefined;
  }

  async ready(): Promise<void> {
    if (this.updateQueue._items.length > 0) {
      await this.updateQueue._items[this.updateQueue._items.length - 1].action();
    }
  }

  async canUpdate(perspectiveId: string, userId?: string): Promise<boolean> {
    await this.ready();

    if (!userId) {
      const cachedDetails = await this.cache.getCachedPerspective(perspectiveId);
      if (cachedDetails && cachedDetails.update.details.canUpdate) {
        return cachedDetails.update.details.canUpdate;
      }
    }

    return true;
  }

  async getPerspective(
    perspectiveId: string,
    options?: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult> {
    await this.ready();

    const cachedPerspective = await this.cache.getCachedPerspective(perspectiveId);
    if (cachedPerspective) {
      /** skip asking the base client only if we already search for the requested levels under
       * this perspective */
      if (
        !options ||
        options.levels === undefined ||
        options.levels === cachedPerspective.levels ||
        !this.readCacheEnabled
      ) {
        return { details: { ...cachedPerspective.update.details } };
      }
    }

    if (!this.base) {
      return { details: {} };
    }

    const result = await this.base.getPerspective(perspectiveId, options);

    if (this.readCacheEnabled) {
      /** cache result and slice */
      this.cache.setCachedPerspective(perspectiveId, {
        update: { perspectiveId, details: result.details },
        levels: options ? options.levels : undefined,
      });

      if (result.slice) {
        /** entities are sent to the store to be cached there */
        await this.store.cacheEntities(result.slice.entities);

        result.slice.perspectives.forEach((perspectiveAndDetails) => {
          this.cache.setCachedPerspective(perspectiveAndDetails.id, {
            update: {
              perspectiveId: perspectiveAndDetails.id,
              details: perspectiveAndDetails.details,
            },
            levels: options ? options.levels : undefined,
          });
        });
      }
    }

    return { details: result.details };
  }
  async createPerspectives(newPerspectives: NewPerspective[]): Promise<void> {
    /** store perspective details */
    await this.updateQueue.enqueue(() =>
      Promise.all(
        newPerspectives.map(async (newPerspective) => {
          await this.store.storeEntity({
            object: newPerspective.perspective.object,
            remote: newPerspective.perspective.object.payload.remote,
          });

          this.cache.newPerspective(newPerspective);

          /** set the current known details of that perspective, can update is set to true */
          this.cache.setCachedPerspective(newPerspective.perspective.id, {
            update: {
              perspectiveId: newPerspective.perspective.id,
              details: {
                ...newPerspective.update.details,
                canUpdate: true,
              },
            },
            levels: -1, // new perspectives are assumed to be fully on the cache
          });
        })
      )
    );
  }

  async updatePerspectives(updates: Update[]): Promise<void> {
    await this.updateQueue.enqueue(() =>
      Promise.all(
        updates.map(async (update) => {
          let timexstamp: number | undefined = undefined;

          if (update.details.headId) {
            const head = await this.store.getEntity<Signed<Commit>>(update.details.headId);
            timexstamp = head.object.payload.timestamp;
          }

          this.cache.addUpdate(update, timexstamp ? timexstamp : Date.now());

          /** update the cache with the new head (keep previous values if update does not
           * specify them)
           * TODO: what if the perpspective is not in the cache? */
          let cachedUpdate = await this.cache.getCachedPerspective(update.perspectiveId);

          if (!cachedUpdate) {
            /** if the perspective was not in the cache, ask the base layer for the initial details */
            const currentDetails = this.base
              ? await this.base.getPerspective(update.perspectiveId, { levels: 0 })
              : { details: {} };

            cachedUpdate = {
              update: {
                perspectiveId: update.perspectiveId,
                details: currentDetails.details,
              },
              levels: 0,
            };
          }

          /** keep original update properties add those new */
          cachedUpdate.update = {
            perspectiveId: update.perspectiveId,
            details: {
              headId: update.details.headId
                ? update.details.headId
                : cachedUpdate.update.details.headId,
              canUpdate: update.details.canUpdate
                ? update.details.canUpdate
                : cachedUpdate.update.details.canUpdate,
              guardianId: update.details.guardianId
                ? update.details.guardianId
                : cachedUpdate.update.details.guardianId,
            },
            indexData: {
              ...cachedUpdate.update.indexData,
              ...update.indexData,
            },
          };

          await this.cache.setCachedPerspective(update.perspectiveId, cachedUpdate);
        })
      )
    );

    this.events.emit(
      ClientEvents.updated,
      updates.map((u) => u.perspectiveId)
    );
  }

  async deletePerspectives(perspectiveIds: string[]): Promise<void> {
    await this.updateQueue.enqueue(() =>
      Promise.all(
        perspectiveIds.map(async (perspectiveId) => {
          this.cache.deletedPerspective(perspectiveId);
          /** set the current known details of that perspective, can update is set to true */

          this.cache.deleteNewPerspective(perspectiveId);
          this.cache.clearCachedPerspective(perspectiveId);
        })
      )
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
    await this.ready();

    await this.updateQueue.enqueue(async () => {
      if (!this.base) {
        throw new Error('base not defined');
      }

      await this.store.flush();

      const newPerspectives = await this.cache.getNewPerspectives();
      const updates = await this.cache.getUpdates();
      const deletedPerspectives = await this.cache.getDeletedPerspective();

      await this.base.update({
        newPerspectives,
        updates,
        deletedPerspectives,
      });

      await this.base.flush();
      await this.clear();
    });
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  /** a mutation with all the changes made relative to the base client */
  async diff(options?: SearchOptions): Promise<EveesMutation> {
    throw new Error('not implemented');
  }

  /** it gets the logged user perspectives (base layers are user aware) */
  async getUserPerspectives(perspectiveId: string): Promise<string[]> {
    throw new Error('not implemented');
  }

  async refresh(): Promise<void> {}
}
