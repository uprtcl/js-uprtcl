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

import { ClientEvents } from '../../interfaces/client';
import { condensateUpdates } from '../../utils/condensate.updates';
import { Entity, EntityCreate } from '../../interfaces/entity';
import { ClientFull } from '../../interfaces/client.full';
import { ClientExplore } from '../../interfaces/client.explore';
import { ClientMutationStore } from '../../interfaces/client.mutation.store';

const LOGINFO = false;

export enum ClientCachedEvents {
  pending = 'changes-pending',
}

/** Reusable implementation of a ClientMutation service.
 * Uses a ClientMutationStore to store mutations */
export class ClientMutationBase implements ClientExplore {
  logger = new Logger('ClientCachedWithBase');

  /** A service to subsribe to udpate on perspectives */
  readonly events: EventEmitter;

  /** A queue to enforce sequentiality between calls to update methods */
  private updateQueue: AsyncQueue;
  private lastQueued: Promise<any> | undefined = undefined;

  constructor(
    readonly base: ClientExplore,
    readonly mutationStore: ClientMutationStore,
    readonly name: string = 'client',
    readonly readCacheEnabled: boolean = true
  ) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(1000);
    this.updateQueue = new AsyncQueue();

    /** subscribe to base client events to update the cache */
    if (this.base && this.base.events) {
      this.base.events.on(ClientEvents.updated, (perspectiveIds: string[]) => {
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
    return this.base.canUpdate(perspectiveId, userId);
  }

  async getPerspective(
    perspectiveId: string,
    options?: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult> {
    await this.ready();

    const result = await this.base.getPerspective(perspectiveId, options);

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

          await this.mutationStore.newPerspective(newPerspective);
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

    this.mutationStore.addUpdate(update);

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
          this.mutationStore.deletedPerspective(perspectiveId);
          /** set the current known details of that perspective, can update is set to true */
          this.mutationStore.deleteNewPerspective(perspectiveId);
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
        if ((this.base as ClientFull).flush) {
          await (this.base as ClientFull).flush(options);
        }
      }

      await this.clear(diff);
    });
  }

  async clear(elements: EveesMutation): Promise<void> {
    if (LOGINFO) this.logger.log(`${this.name} clear()`, { updateQueue: this.updateQueue });
    this.mutationStore.clear(elements);
    this.removeEntities(elements.entities.map((e) => e.hash));
  }

  /** a mutation with all the changes made relative to the base client */
  async diff(options?: SearchOptions, condensate: boolean = false): Promise<EveesMutation> {
    if (LOGINFO) this.logger.log(`${this.name} diff()`, {});

    const mutation = await this.mutationStore.diff(options);

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

  async storeEntities(entities: Entity[]): Promise<Entity<any>[]> {
    /** store perspective details */
    if (LOGINFO) this.logger.log(`${this.name} storeEntities()`, entities);
    await Promise.all(
      entities.map(async (entity) => {
        if (!entity.hash) {
          /** inject hash */
          entity = await this.hashEntity(entity);
        }
        this.mutationStore.storeEntity(entity);
      })
    );
    return entities;
  }

  async storeEntity(entity: Entity<any>): Promise<Entity<any>> {
    const entities = await this.storeEntities([entity]);
    return entities[0];
  }

  removeEntities(hashes: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getEntities(hashes: string[]): Promise<Entity<any>[]> {
    const found: Entity[] = [];
    const notFound: string[] = [];

    /** Check the cache */
    await Promise.all(
      hashes.map(async (hash) => {
        const entityNew = await this.mutationStore.getNewEntity(hash);
        if (entityNew) {
          found.push({ ...entityNew });
        } else {
          notFound.push(hash);
        }
      })
    );

    if (notFound.length === 0) {
      return found;
    }

    // if not found, then ask the base store
    const entities = await this.base.getEntities(notFound);

    if (entities.length !== notFound.length) {
      throw new Error(`Entities not found ${JSON.stringify(notFound)}`);
    }

    return found.concat(entities);
  }

  async getEntity<T = any>(hash: string): Promise<Entity<T>> {
    const entities = await this.getEntities([hash]);
    return entities[0];
  }

  hashEntities(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    return this.base.hashEntities(entities);
  }

  async hashEntity<T = any>(entity: EntityCreate<any>): Promise<Entity<T>> {
    const entities = await this.hashEntities([entity]);
    return entities[0];
  }
}
