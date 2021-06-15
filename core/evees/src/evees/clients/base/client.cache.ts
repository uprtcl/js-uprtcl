import lodash from 'lodash';

import { MutationHelper } from '../../utils';
import {
  ClientCacheStore,
  ClientAndExplore,
  EntityResolver,
  GetPerspectiveOptions,
  PerspectiveGetResult,
  EveesMutationCreate,
  NewPerspective,
  Update,
  SearchOptions,
} from '../../interfaces/';

/** read-only cache that keeps read perspecties and entities onmemory or hit the base
 *  layer if they are not found */
export class ClientCache implements ClientAndExplore {
  constructor(
    protected base: ClientAndExplore,
    protected cache: ClientCacheStore,
    protected entityResolver: EntityResolver,
    private injectEntities: boolean = false
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
    if (result.details.headId !== undefined || result.details.canUpdate !== undefined) {
      await this.cache.setCachedPerspective(perspectiveId, {
        update: { perspectiveId, details: result.details },
        levels: options ? options.levels : undefined,
      });
    }

    if (result.slice) {
      /** entities are added to the entityResolver and are, thus, made available everywhere */
      await this.entityResolver.putEntities(result.slice.entities);

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
          mutation.newPerspectives.map((newPerspective) => {
            // cache new perspectives as canUpdate by default
            newPerspective.update.details.canUpdate = true;

            return this.cache.setCachedPerspective(newPerspective.perspective.hash, {
              update: newPerspective.update,
              levels: -1, // new perspectives are assumed to be fully on the cache
            });
          })
        )
      : Promise.resolve([]);

    const cacheUpdate = mutation.updates
      ? Promise.all(
          mutation.updates.map(async (update) => {
            const currentUpdate = await this.cache.getCachedPerspective(update.perspectiveId);
            const currentDetails =
              (currentUpdate && currentUpdate.update && currentUpdate.update.details) || {};

            update.details = lodash.merge(currentDetails, update.details);

            this.cache.setCachedPerspective(update.perspectiveId, {
              update,
              levels: -1, // new perspectives are assumed to be fully on the cache
            });
          })
        )
      : Promise.resolve([]);

    const cacheDeletes = mutation.deletedPerspectives
      ? Promise.all(
          mutation.deletedPerspectives.map((perspectiveId) =>
            this.cache.clearCachedPerspective(perspectiveId)
          )
        )
      : Promise.resolve([]);

    if (this.injectEntities) {
      const entitiesHashes = await MutationHelper.getMutationEntitiesHashes(
        mutation,
        this.entityResolver
      );
      const entities = await this.entityResolver.getEntities(entitiesHashes);
      mutation.entities = entities;
    }

    /** optimistically cache as read details and update on the base layer */
    await Promise.all([
      cacheNewPerspectives,
      cacheUpdate,
      cacheDeletes,
      this.base.update(mutation),
    ]);
  }

  storeEntity(entityId: string): Promise<void> {
    throw new Error('Method not implemented.');
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

  explore(searchOptions: SearchOptions, fetchOptions?: GetPerspectiveOptions | undefined) {
    return this.base.explore(searchOptions, fetchOptions);
  }
}
