import EventEmitter from 'events';
import { Signed } from 'src/patterns/interfaces/signable';
import { Logger } from 'src/utils/logger';
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
} from '../interfaces/types';
import { Proposals } from '../proposals/proposals';
import { getMutationEntitiesHashes } from '../utils/mutation.entities';

export class RemoteRouter implements Client {
  logger = new Logger('RemoteRouter');

  proposals?: Proposals | undefined;
  events: EventEmitter;

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

  storeEntity(entityId: string): Promise<void> {
    throw new Error('Method not implemented.');
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
}
