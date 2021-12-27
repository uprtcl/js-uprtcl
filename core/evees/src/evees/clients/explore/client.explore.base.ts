import EventEmitter from 'events';
import {
  ClientAndExplore,
  ClientAndExploreCached,
  EveesMutationCreate,
  GetPerspectiveOptions,
  NewPerspective,
  PerspectiveGetResult,
  SearchOptions,
  SearchResult,
  Update,
} from '../../interfaces';
import { ExploreCacheStore } from './explore.cache';

export class ExploreCachedBase implements ClientAndExploreCached {
  cache: ExploreCacheStore;

  constructor(protected base: ClientAndExplore, cache: ExploreCacheStore) {
    this.cache = cache;
  }

  async explore(
    searchOptions: SearchOptions,
    fetchOptions?: GetPerspectiveOptions
  ): Promise<SearchResult> {
    const cached = await this.cache.get(searchOptions, fetchOptions);
    if (cached) {
      return cached;
    }

    const result = await this.base.explore(searchOptions, fetchOptions);
    await this.cache.set(searchOptions, result, fetchOptions);

    return result;
  }

  async clearExplore(
    searchOptions: SearchOptions,
    fetchOptions?: GetPerspectiveOptions
  ): Promise<void> {
    return this.cache.clear(searchOptions, fetchOptions);
  }

  get events(): EventEmitter | undefined {
    return this.base.events;
  }

  get proposals() {
    return this.base.proposals;
  }

  getPerspective(
    perspectiveId: string,
    options?: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult> {
    return this.base.getPerspective(perspectiveId, options);
  }
  update(mutation: EveesMutationCreate): Promise<void> {
    return this.base.update(mutation);
  }
  newPerspective(newPerspective: NewPerspective): Promise<void> {
    return this.base.newPerspective(newPerspective);
  }
  deletePerspective(perspectiveId: string): Promise<void> {
    return this.base.deletePerspective(perspectiveId);
  }
  updatePerspective(update: Update): Promise<void> {
    return this.base.updatePerspective(update);
  }
  canUpdate(perspectiveId: string, userId?: string): Promise<boolean> {
    return this.base.canUpdate(perspectiveId, userId);
  }
}
