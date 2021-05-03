import EventEmitter from 'events';
import { Signed } from 'src/patterns/interfaces/signable';
import { Logger } from 'src/utils/logger';
import { CASStore } from '../interfaces/cas-store';
import { Client, ClientEvents } from '../interfaces/client';
import { ClientRemote } from '../interfaces/client.remote';
import { EntityCreate, Entity } from '../interfaces/entity';
import { EntityResolver } from '../interfaces/entity.resolver';
import {
  GetPerspectiveOptions,
  NewPerspective,
  Update,
  EveesMutation,
  EveesMutationCreate,
  PerspectiveGetResult,
  SearchOptions,
  SearchResult,
  Perspective,
} from '../interfaces/types';
import { Proposals } from '../proposals/proposals';
import { Secured } from '../utils/cid-hash';
import { getMutationEntitiesHashes } from '../utils/mutation.entities';

export class RemoteRouter implements Client {
  logger = new Logger('RemoteRouter');

  proposals?: Proposals | undefined;
  events: EventEmitter;
  storeCache!: CASStore;

  remotesMap: Map<string, ClientRemote>;

  constructor(protected remotes: ClientRemote[], protected entityResolver: EntityResolver) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(1000);

    this.remotesMap = new Map();
    remotes.forEach((remote) => {
      this.remotesMap.set(remote.id, remote);
    });

    /** forward events */
    this.remotes.forEach((remote) => {
      if (remote.events) {
        remote.events.on(ClientEvents.updated, (perspectiveIds) => {
          this.logger.log(`event : ${ClientEvents.updated}`, { remote, perspectiveIds });
          this.events.emit(ClientEvents.updated, perspectiveIds);
        });
      }
    });
  }

  /** inject a store to be used to resolve entities (usually a fast store cache from up the stack) */
  setStore(store: CASStore) {
    this.storeCache = store;
  }

  async getEntity<T = any>(hash: string): Promise<Entity<T>> {
    return this.entityResolver.getEntity<T>(hash);
  }

  async getPerspectiveRemote(perspectiveId: string): Promise<ClientRemote> {
    const perspective = await this.getEntity<Signed<Entity>>(perspectiveId);

    if (!perspective) {
      throw new Error(`Perspective entity ${perspectiveId} not resolved`);
    }

    return this.getRemote(perspective.object.payload.remote);
  }

  async splitMutation(mutation: EveesMutationCreate): Promise<Map<string, EveesMutationCreate>> {
    const mutationsPerRemote = new Map<string, EveesMutation>();

    const fillDeleted = mutation.deletedPerspectives
      ? Promise.all(
          mutation.deletedPerspectives.map(
            async (deletedPerspective): Promise<void> => {
              const remote = await this.getPerspectiveRemote(deletedPerspective);
              let mutation = mutationsPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                  entitiesHashes: [],
                };
                mutationsPerRemote.set(remote.id, mutation);
              }
              if (!mutation.deletedPerspectives) {
                mutation.deletedPerspectives = [];
              }
              mutation.deletedPerspectives.push(deletedPerspective);
            }
          )
        )
      : Promise.resolve([]);

    const fillNew = mutation.newPerspectives
      ? Promise.all(
          mutation.newPerspectives.map(
            async (newPerspective): Promise<void> => {
              const remote = await this.getPerspectiveRemote(newPerspective.perspective.hash);
              let mutation = mutationsPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                  entitiesHashes: [],
                };
                mutationsPerRemote.set(remote.id, mutation);
              }
              if (!mutation.newPerspectives) {
                mutation.newPerspectives = [];
              }
              mutation.newPerspectives.push(newPerspective);
            }
          )
        )
      : Promise.resolve([]);

    const fillUpdated = mutation.updates
      ? Promise.all(
          mutation.updates.map(
            async (update): Promise<void> => {
              const remote = await this.getPerspectiveRemote(update.perspectiveId);
              let mutation = mutationsPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                  entitiesHashes: [],
                };
                mutationsPerRemote.set(remote.id, mutation);
              }
              if (!mutation.updates) {
                mutation.updates = [];
              }
              mutation.updates.push(update);
            }
          )
        )
      : Promise.resolve([]);

    await Promise.all([fillDeleted, fillNew, fillUpdated]);

    /** extract mutation entities and store on the entitiesHashes property */
    await Promise.all(
      Array.from(mutationsPerRemote.entries()).map(async ([remoteId, mutation]) => {
        const mutationEntities = await getMutationEntitiesHashes(mutation, this.entityResolver);
        mutation.entitiesHashes = mutationEntities;
      })
    );

    /** at this point each mutation has the updates and entities for each remote */
    return mutationsPerRemote;
  }

  async newPerspective(newPerspective: NewPerspective) {
    throw new Error('Method not implemented.');
  }

  async deletePerspective(perspectiveId: string) {
    throw new Error('Method not implemented.');
  }

  async updatePerspective(update: Update) {
    throw new Error('Method not implemented.');
  }

  async explore(options: SearchOptions, fetchOptions?: GetPerspectiveOptions) {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.explore ? remote.explore(options) : { perspectiveIds: [] };
      })
    );
    // search results are concatenated
    let combinedResult: SearchResult = {
      perspectiveIds: [],
      forksDetails: [],
      slice: {
        entities: [],
        perspectives: [],
      },
      ended: !all.map((r) => r.ended).find((e) => e !== true), // if ended is false there is any remote in which ended !== true
    };
    all.forEach((result) => {
      combinedResult.perspectiveIds.push(...result.perspectiveIds);
      if (!combinedResult.slice) throw new Error('unexpected');

      if (result.slice) {
        combinedResult.slice.entities.push(...result.slice.entities);
        combinedResult.slice.perspectives.push(...result.slice.perspectives);
      }

      if (!combinedResult.forksDetails) throw new Error('unexpected');

      if (result.forksDetails) {
        combinedResult.forksDetails.push(...result.forksDetails);
      }
    });
    return combinedResult;
  }

  async getPerspective(
    perspectiveId: string,
    options: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult> {
    const remote = await this.getPerspectiveRemote(perspectiveId);
    return remote.getPerspective(perspectiveId, options);
  }

  async canUpdate(perspectiveId: string, userId?: string) {
    const remote = await this.getPerspectiveRemote(perspectiveId);
    return remote.canUpdate(perspectiveId, userId);
  }

  async update(mutation: EveesMutationCreate) {
    const mutationPerRemote = await this.splitMutation(mutation);
    /** at this point the mutation is split per remote and is sent to each remote */
    await Promise.all(
      Array.from(mutationPerRemote.keys()).map((remoteId) => {
        const mutation = mutationPerRemote.get(remoteId) as EveesMutation;
        const remote = this.getRemote(remoteId);
        return remote.update(mutation);
      })
    );
  }

  getRemote(remoteId?: string): ClientRemote {
    if (!remoteId) {
      return this.remotes[0];
    }

    const remote = this.remotes.find((r) => r.id === remoteId);
    if (!remote) throw new Error(`remote ${remoteId} not found`);
    return remote;
  }

  splitEntities(entities: (EntityCreate | Entity)[]): Map<string, EntityCreate[]> {
    const entitiesPerRemote = new Map<string, EntityCreate[]>();

    entities.forEach((entity) => {
      const remote = this.getRemote(entity.remote);
      let current = entitiesPerRemote.get(remote.id);
      if (!current) {
        current = [];
      }
      current.push(entity);
      entitiesPerRemote.set(remote.id, current);
    });

    return entitiesPerRemote;
  }

  async hashEntities(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    const entitiesPerStore = this.splitEntities(entities);

    const entitiesPerRemote = await Promise.all(
      Array.from(entitiesPerStore.entries()).map(async ([remoteId, entities]) => {
        const remote = this.getRemote(remoteId);
        return remote.hashObjects(entities);
      })
    );

    return Array.prototype.concat.apply([], entitiesPerRemote);
  }

  async hashEntity<T = any>(entity: Entity): Promise<Entity<T>> {
    const entities = await this.hashEntities([entity]);
    return entities[0];
  }

  private async tryGetFromSources(hashes: string[]): Promise<Entity[]> {
    const requestedOn: string[] = [];
    const allObjects: Map<string, Entity> = new Map();

    return new Promise((resolve) => {
      Array.from(this.remotesMap.keys()).map(async (remoteId) => {
        try {
          const entities = await this.getFromRemote(hashes, remoteId);
          requestedOn.push(remoteId);

          // append to all found objects (prevent duplicates)
          entities.map((e) => allObjects.set(e.hash, e));

          // if found as many objects as hashes requested, resove (dont wait for other sources to return)
          if (entities.length === hashes.length) {
            resolve(Array.from(allObjects.values()));
          }
        } catch (e) {
          // a failure to get objects from a source is consider as objects not present
          requestedOn.push(remoteId);
        }

        // resolve once all sources have been requested
        if (requestedOn.length === this.remotesMap.size) {
          resolve(Array.from(allObjects.values()));
        }
      });
    });
  }

  public async getFromRemote(hashes: string[], remoteId: string): Promise<Entity[]> {
    const remote = this.getRemote(remoteId);
    if (!remote) throw new Error(`Remote ${remoteId} not found`);
    return remote.getEntities(hashes);
  }
}
