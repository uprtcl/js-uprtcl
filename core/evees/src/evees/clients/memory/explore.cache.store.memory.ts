import { SearchOptions, SearchResult, GetPerspectiveOptions } from 'src/evees/interfaces';
import { hashObject } from 'src/evees/utils';
import { ExploreCacheStore } from '../explore/explore.cache';

interface SearchResultCached {
  result: SearchResult;
  on: number;
}

interface CanonicalOptions {
  options: SearchOptions;
  fetchOptions?: GetPerspectiveOptions;
}

export class ExploreCacheStoreMemory implements ExploreCacheStore {
  protected requests: Map<string, SearchResultCached> = new Map();

  constructor(protected duration: number = 1000 * 60) {}

  async getId(options: SearchOptions, fetchOptions?: GetPerspectiveOptions): Promise<string> {
    const canonicalOptions: CanonicalOptions = { options };
    if (fetchOptions) {
      canonicalOptions.fetchOptions = fetchOptions;
    }

    return hashObject(canonicalOptions);
  }

  async set(
    options: SearchOptions,
    result: SearchResult,
    fetchOptions?: GetPerspectiveOptions
  ): Promise<void> {
    const id = await this.getId(options, fetchOptions);
    this.requests.set(id, { result, on: Date.now() });
  }

  async get(
    options: SearchOptions,
    fetchOptions: GetPerspectiveOptions
  ): Promise<SearchResult | undefined> {
    const id = await this.getId(options, fetchOptions);
    const cached = this.requests.get(id);
    if (cached && cached.on > Date.now() - this.duration) {
      return cached.result;
    }

    this.requests.delete(id);
    return undefined;
  }
}
