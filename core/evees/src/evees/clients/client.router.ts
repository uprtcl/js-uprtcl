import EventEmitter from 'events';
import { Logger } from 'src/utils/logger';
import { Client, ClientEvents } from '../interfaces/client';
import { EntityCreate, Entity } from '../interfaces/entity';
import { RemoteEvees } from '../interfaces/remote.evees';
import {
  GetPerspectiveOptions,
  NewPerspective,
  Update,
  EveesMutation,
  EveesMutationCreate,
  PerspectiveGetResult,
  SearchOptions,
  SearchResult,
} from '../interfaces/types';
import { Proposals } from '../proposals/proposals';

export class RemoteRouter implements Client {
  logger = new Logger('RemoteRouter');

  proposals?: Proposals | undefined;
  events: EventEmitter;

  constructor(protected remotes: RemoteEvees[]) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(1000);

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

  async getPerspectiveRemote(
    perspectiveId: string,
    entities?: Map<string, Entity>
  ): Promise<RemoteEvees> {
    let perspective;

    if (entities) {
      perspective = entities.get(perspectiveId);
    }
    if (!perspective) {
      perspective = this.getEntity(perspectiveId);
    }
    return this.getRemote(perspective.object.payload.remote);
  }

  async splitMutation(mutation: EveesMutationCreate): Promise<Map<string, EveesMutationCreate>> {
    const mutationPerRemote = new Map<string, EveesMutationCreate>();
    const entitiesMap = new Map<string, Entity>();
    if (mutation.entities) {
      mutation.entities.forEach((e) => entitiesMap.set(e.id, e));
    }

    const fillEntities = mutation.entities
      ? Promise.all(
          mutation.entities.map(
            async (entity): Promise<void> => {
              if (!entity.remote) {
                throw new Error('entities must include what remote the should go to');
              }
              const remote = entity.remote;
              let mutation = mutationPerRemote.get(remote);

              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                  entities: [],
                };
                mutationPerRemote.set(remote, mutation);
              }
              if (!mutation.entities) {
                mutation.entities = [];
              }
              mutation.entities.push(entity);
            }
          )
        )
      : Promise.resolve([]);

    const fillDeleted = mutation.deletedPerspectives
      ? Promise.all(
          mutation.deletedPerspectives.map(
            async (deletedPerspective): Promise<void> => {
              const remote = await this.getPerspectiveRemote(deletedPerspective, entitiesMap);
              let mutation = mutationPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                  entities: [],
                };
                mutationPerRemote.set(remote.id, mutation);
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
              const remote = await this.getPerspectiveRemote(
                newPerspective.perspective.id,
                entitiesMap
              );
              let mutation = mutationPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                  entities: [],
                };
                mutationPerRemote.set(remote.id, mutation);
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
              const remote = await this.getPerspectiveRemote(update.perspectiveId, entitiesMap);
              let mutation = mutationPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                  entities: [],
                };
                mutationPerRemote.set(remote.id, mutation);
              }
              if (!mutation.updates) {
                mutation.updates = [];
              }
              mutation.updates.push(update);
            }
          )
        )
      : Promise.resolve([]);

    await Promise.all([fillEntities, fillDeleted, fillNew, fillUpdated]);

    return mutationPerRemote;
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

  /** get all user perspectives on all registered remotes */
  async getUserPerspectives(perspectiveId: string) {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.getUserPerspectives(perspectiveId);
      })
    );
    return Array.prototype.concat.apply([], all);
  }

  getRemote(remoteId?: string): RemoteEvees {
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

  storeEntities(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    throw new Error('Method not implemented.');
  }
  storeEntity(entity: EntityCreate<any>): Promise<Entity<any>> {
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
