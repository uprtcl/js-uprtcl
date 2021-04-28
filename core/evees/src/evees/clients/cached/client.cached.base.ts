import { EventEmitter } from 'events';

import {
  Update,
  NewPerspective,
  GetPerspectiveOptions,
  PerspectiveGetResult,
  EveesMutation,
  Commit,
  SearchOptions,
  FlushConfig,
  EveesMutationCreate,
} from '../../interfaces/types';
import { Logger } from '../../../utils/logger';
import { Signed } from '../../../patterns/interfaces/signable';
import { AsyncQueue } from '../../../utils/async';

import { Client, ClientEvents } from '../../interfaces/client';
import { ClientCache } from '../../interfaces/client.cache';
import { ClientCached } from '../../interfaces/client.cached';
import { condensateUpdates } from '../../utils/condensate.updates';
import { Entity, EntityCreate } from '../../interfaces/entity';

const LOGINFO = false;

export enum ClientCachedEvents {
  pending = 'changes-pending',
}

/** Reusable implementation of a ClientCached service.
 * Uses a ClientCache to store mutations */
export class ClientCachedBase implements ClientCached {
  logger = new Logger('ClientCachedWithBase');

  /** A service to subsribe to udpate on perspectives */
  readonly events: EventEmitter;

  /** A queue to enforce sequentiality between calls to update methods */
  private updateQueue: AsyncQueue;
  private lastQueued: Promise<any> | undefined = undefined;

  constructor(
    readonly base: Client,
    readonly cache: ClientCache,
    readonly name: string = 'client',
    readonly readCacheEnabled: boolean = true
  ) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(1000);
    this.updateQueue = new AsyncQueue();

    /** subscribe to base client events to update the cache */
    if (this.base && this.base.events) {
      this.base.events.on(ClientEvents.updated, (perspectiveIds: string[]) => {
        /** remove the cached perspectives if updated */
        perspectiveIds.forEach((id) => {
          this.cache.clearCachedPerspective(id);
        });

        if (LOGINFO)
          this.logger.log(`${this.name} event : ${ClientEvents.updated}`, perspectiveIds);

        this.events.emit(ClientEvents.updated, perspectiveIds);
      });
    }
  }

  get proposals() {
    if (this.base) {
      return this.base.proposals;
    }

    return undefined;
  }

  async ready(): Promise<void> {
    if (this.lastQueued) {
      await this.lastQueued;
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
      await this.cache.setCachedPerspective(perspectiveId, {
        update: { perspectiveId, details: result.details },
        levels: options ? options.levels : undefined,
      });

      if (result.slice) {
        /** entities are sent to the store to be cached there */
        await this.storeEntities(result.slice.entities);

        await Promise.all(
          result.slice.perspectives.map(async (perspectiveAndDetails) => {
            await this.cache.setCachedPerspective(perspectiveAndDetails.id, {
              update: {
                perspectiveId: perspectiveAndDetails.id,
                details: perspectiveAndDetails.details,
              },
              levels: options ? options.levels : undefined,
            });
          })
        );
      }
    }

    return { details: result.details };
  }

  async createPerspectives(newPerspectives: NewPerspective[]): Promise<void> {
    if (LOGINFO) this.logger.log(`${this.name} createPerspectives()`, newPerspectives);
    /** store perspective details */
    await this.enqueueTask(() => {
      if (LOGINFO) this.logger.log(`${this.name} createPerspectives() - exec`, newPerspectives);
      return Promise.all(
        newPerspectives.map(async (newPerspective) => {
          const perspective = await this.base.hashEntity({
            object: newPerspective.perspective.object,
            remote: newPerspective.perspective.object.payload.remote,
          });
          await this.storeEntity(perspective);

          await this.cache.newPerspective(newPerspective);

          /** set the current known details of that perspective, can update is set to true */
          const update = newPerspective.update;
          update.details.canUpdate = true;

          return this.cache.setCachedPerspective(newPerspective.perspective.id, {
            update: update,
            levels: -1, // new perspectives are assumed to be fully on the cache
          });
        })
      );
    });
  }

  explore(searchOptions: SearchOptions, fetchOptions?: GetPerspectiveOptions) {
    if (this.base && this.base.explore) {
      return this.base.explore(searchOptions, fetchOptions);
    }
    throw new Error('base client not defined or not have explore function');
  }

  async updatePerspectiveEffective(update: Update) {
    if (LOGINFO) this.logger.log(`${this.name} updatePerspectiveEffective()`, { update });

    let timexstamp: number | undefined = undefined;

    if (update.details.headId) {
      const head = await this.getEntity<Signed<Commit>>(update.details.headId);
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
        headId: update.details.headId ? update.details.headId : cachedUpdate.update.details.headId,
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

    /** emit update */
    const under: SearchOptions = {
      above: { elements: [{ id: update.perspectiveId }] },
    };

    const { perspectiveIds: parentsIds } = await this.explore(under);

    if (LOGINFO)
      this.logger.log(`${this.name} event : ${ClientEvents.ecosystemUpdated}`, parentsIds);

    this.events.emit(ClientEvents.ecosystemUpdated, parentsIds);

    if (LOGINFO)
      this.logger.log(`${this.name} event : ${ClientEvents.updated}`, [update.perspectiveId]);

    this.events.emit(ClientEvents.updated, [update.perspectiveId]);
  }

  /** debounced update */
  async updatePerspective(update: Update) {
    if (LOGINFO) this.logger.log(`${this.name} updatePerspective()`, { update });
    await this.enqueueTask(() => this.updatePerspectiveEffective(update));
  }

  async enqueueTask(task: () => Promise<any>): Promise<any> {
    if (LOGINFO) this.logger.log(`${this.name} enqueueTask()`, { task });
    if (LOGINFO) this.logger.log(`${this.name} event : ${ClientCachedEvents.pending}`, true);
    this.events.emit(ClientCachedEvents.pending, true);

    const queueRun = this.updateQueue.enqueue(async () => {
      await task();
      /** check if this was the last pending task after executing it */
      if (this.updateQueue.size === 0) {
        if (LOGINFO) this.logger.log(`${this.name} event : ${ClientCachedEvents.pending}`, false);
        this.events.emit(ClientCachedEvents.pending, false);
      }
    });

    this.lastQueued = queueRun;
    return queueRun;
  }

  async updatePerspectives(updates: Update[]): Promise<void> {
    if (LOGINFO) this.logger.log(`${this.name} updatePerspectives()`, { updates });
    updates.map(async (update) => this.updatePerspective(update));
  }

  async deletePerspectives(perspectiveIds: string[]): Promise<void> {
    if (LOGINFO) this.logger.log(`${this.name} deletePerspectives()`, { perspectiveIds });
    await this.enqueueTask(() =>
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
    if (LOGINFO) this.logger.log(`${this.name} update()`, { mutation });

    if (mutation.entities) {
      await this.storeEntities(mutation.entities);
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
    if (LOGINFO) this.logger.log(`${this.name} newPerspective()`, { newPerspective });
    return this.update({ newPerspectives: [newPerspective] });
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    if (LOGINFO) this.logger.log(`${this.name} deletePerspective()`, { perspectiveId });
    await this.update({ deletedPerspectives: [perspectiveId] });
  }

  async flush(options?: SearchOptions, flush?: FlushConfig): Promise<void> {
    if (LOGINFO) this.logger.log(`${this.name} flush()`, { updateQueue: this.updateQueue });

    await this.enqueueTask(async () => {
      if (!this.base) {
        throw new Error('base not defined');
      }

      const diff = await this.diff(options);

      if (LOGINFO) this.logger.log(`${this.name} flush -diff`, diff);

      await this.base.update(diff);

      if (flush && flush.recurse) {
        if ((this.base as ClientCached).flush) {
          await (this.base as ClientCached).flush(options);
        }
      }

      await this.clear(diff);
    });
  }

  async clear(elements: EveesMutation): Promise<void> {
    if (LOGINFO) this.logger.log(`${this.name} clear()`, { updateQueue: this.updateQueue });
    this.cache.clear(elements);
    this.removeEntities(elements.entities.map((e) => e.id));
  }

  /** a mutation with all the changes made relative to the base client */
  async diff(options?: SearchOptions, condensate: boolean = false): Promise<EveesMutation> {
    if (LOGINFO) this.logger.log(`${this.name} diff()`, {});

    const mutation = await this.cache.diff(options);

    if (condensate) {
      mutation.updates = await condensateUpdates(mutation.updates, this);
      if (LOGINFO) this.logger.log('condensate diff', { options, mutation });
    }

    return mutation;
  }

  /** it gets the logged user perspectives (base layers are user aware) */
  async getUserPerspectives(perspectiveId: string): Promise<string[]> {
    throw new Error('not implemented');
  }

  async refresh(): Promise<void> {}

  storeEntities(entities: Entity<any>[]): Promise<Entity<any>[]> {
    throw new Error('Method not implemented.');
  }
  storeEntity(entity: Entity<any>): Promise<Entity<any>> {
    throw new Error('Method not implemented.');
  }
  removeEntities(hashes: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getEntities(hashes: string[]): Promise<Entity<any>[]> {
    throw new Error('Method not implemented.');
  }
  getEntity<T = any>(hash: string): Promise<Entity<T>> {
    throw new Error('Method not implemented.');
  }
  hashEntities(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    throw new Error('Method not implemented.');
  }
  hashEntity<T = any>(entity: EntityCreate<any>): Promise<Entity<T>> {
    throw new Error('Method not implemented.');
  }
}
