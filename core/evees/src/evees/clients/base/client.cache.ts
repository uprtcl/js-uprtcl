import { CASResolver } from 'src/evees/interfaces/cas.cache.store';
import { ClientCacheStore } from '../../interfaces/client.cache.store';
import { ClientExplore } from '../../interfaces/client.explore';
import { EntityCreate, Entity } from '../../interfaces/entity';
import {
  GetPerspectiveOptions,
  PerspectiveGetResult,
  EveesMutationCreate,
  NewPerspective,
  Update,
  SearchOptions,
} from '../../interfaces/types';

/** read-only cache that keeps read perspecties and entities onmemory or hit the base
 *  layer if they are not found */
export class ClientCache implements ClientExplore {
  constructor(
    protected base: ClientExplore,
    protected cache: ClientCacheStore,
    protected casResolver: CASResolver
  ) {}

  async getPerspective(
    perspectiveId: string,
    options?: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult> {
    const cachedPerspective = await this.cache.getCachedPerspective(perspectiveId);

    if (cachedPerspective) {
      /** skip asking the base client only if we already search for the requested levels under
       * this perspective */
      if (!options || options.levels === undefined || options.levels === cachedPerspective.levels) {
        return { details: { ...cachedPerspective.update.details } };
      }
    }

    const result = await this.base.getPerspective(perspectiveId, options);

    /** cache result and slice */
    await this.cache.setCachedPerspective(perspectiveId, {
      update: { perspectiveId, details: result.details },
      levels: options ? options.levels : undefined,
    });

    if (result.slice) {
      /** entities are added to the casResolver and are then available everywhere */
      await this.casResolver.storeEntities(result.slice.entities);

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

    return { details: result.details };
  }

  async update(mutation: EveesMutationCreate): Promise<void> {
    const cacheNewPerspectives = mutation.newPerspectives
      ? Promise.all(
          mutation.newPerspectives.map((newPerspective) =>
            this.cache.setCachedPerspective(newPerspective.perspective.hash, {
              update: newPerspective.update,
              levels: -1, // new perspectives are assumed to be fully on the cache
            })
          )
        )
      : Promise.resolve([]);

    const cacheUpdate = mutation.updates
      ? Promise.all(
          mutation.updates.map((update) =>
            this.cache.setCachedPerspective(update.perspectiveId, {
              update,
              levels: -1, // new perspectives are assumed to be fully on the cache
            })
          )
        )
      : Promise.resolve([]);

    const cacheDeletes = mutation.deletedPerspectives
      ? Promise.all(
          mutation.deletedPerspectives.map((perspectiveId) =>
            this.cache.clearCachedPerspective(perspectiveId)
          )
        )
      : Promise.resolve([]);

    /** optimistically cache as read details and update on the base layer */
    await Promise.all([
      cacheNewPerspectives,
      cacheUpdate,
      cacheDeletes,
      this.base.update(mutation),
    ]);
  }

  newPerspective(newPerspective: NewPerspective): Promise<void> {
    return this.update({ newPerspectives: [newPerspective] });
  }

  deletePerspective(perspectiveId: string): Promise<void> {
    return this.update({ deletedPerspectives: [perspectiveId] });
  }

  updatePerspective(update: Update): Promise<void> {
    return this.update({ updates: [update] });
  }

  canUpdate(perspectiveId: string, userId?: string): Promise<boolean> {
    return this.base.canUpdate(perspectiveId, userId);
  }

  hashEntities(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    return this.base.hashEntities(entities);
  }

  async hashEntity<T = any>(entity: EntityCreate<any>): Promise<Entity<T>> {
    const entities = await this.hashEntities([entity]);
    return entities[0];
  }

  explore(searchOptions: SearchOptions, fetchOptions?: GetPerspectiveOptions | undefined) {
    return this.base.explore(searchOptions, fetchOptions);
  }
}
