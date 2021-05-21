import { EventEmitter } from 'events';
import lodash from 'lodash';

import {
  Update,
  NewPerspective,
  GetPerspectiveOptions,
  PerspectiveGetResult,
  EveesMutation,
  SearchOptions,
  FlushConfig,
  EveesMutationCreate,
  ClientAndExplore,
  ClientFull,
  ClientMutationStore,
  EntityResolver,
  ClientEvents,
} from '../../interfaces';
import { Logger } from '../../../utils/logger';
import { AsyncQueue } from '../../../utils/async';

import { condensateUpdates, mutationAppendOnEcosystem } from '../../utils/updates.utils';

const LOGINFO = false;

export enum ClientCachedEvents {
  pending = 'changes-pending',
}

/** Reusable implementation of a ClientMutation service.
 * Uses a ClientMutationStore to store mutations */
export class ClientMutationBase implements ClientAndExplore {
  logger = new Logger('ClientCachedWithBase');

  /** A service to subsribe to udpate on perspectives */
  readonly events: EventEmitter;

  /** A queue to enforce sequentiality between calls to update methods */
  private updateQueue: AsyncQueue;
  private lastQueued: Promise<any> | undefined = undefined;

  protected entityResolver!: EntityResolver;

  constructor(
    readonly base: ClientAndExplore,
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

  setEntityResolver(resolver: EntityResolver) {
    this.entityResolver = resolver;
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
    /** Always ask the base layer to get the non-mutated details as base details.
     * There should be cache layer below so that this does not hit the remote */
    const baseResult = await this.base.getPerspective(perspectiveId, options);

    const details = await this.mutationStore.getPerspective(perspectiveId);
    if (details) {
      return { details: lodash.merge(baseResult.details, details), slice: baseResult.slice };
    }

    return baseResult;
  }

  async createPerspectives(newPerspectives: NewPerspective[]): Promise<void> {
    if (LOGINFO) this.logger.log(`${this.name} createPerspectives()`, newPerspectives);
    /** store perspective details */
    await this.enqueueTask(() => {
      if (LOGINFO) this.logger.log(`${this.name} createPerspectives() - exec`, newPerspectives);
      return Promise.all(
        newPerspectives.map(async (newPerspective) => {
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

  async flush(options?: SearchOptions, flush: FlushConfig = { recurse: true }): Promise<void> {
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
  }

  /** a mutation with all the changes made relative to the base client */
  async diff(options?: SearchOptions, condensate: boolean = false): Promise<EveesMutation> {
    if (LOGINFO) this.logger.log(`${this.name} diff()`, {});

    const mutation = await this.mutationStore.diff(options);

    /** if I searched under, then the results must be onEcosystem. Append it. */
    if (options && options.under) {
      mutationAppendOnEcosystem(
        mutation,
        options.under.elements.map((el) => el.id)
      );
    }

    if (condensate) {
      mutation.updates = await condensateUpdates(mutation.updates, this.entityResolver);
      if (LOGINFO) this.logger.log('condensate diff', { options, mutation });
    }

    return mutation;
  }

  /** it gets the logged user perspectives (base layers are user aware) */
  async getUserPerspectives(perspectiveId: string): Promise<string[]> {
    throw new Error('not implemented');
  }

  async refresh(): Promise<void> {}
}
