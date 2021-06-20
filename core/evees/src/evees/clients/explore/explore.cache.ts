import { GetPerspectiveOptions, SearchOptions, SearchResult } from '../../interfaces';

export interface ExploreCacheStore {
  set(
    options: SearchOptions,
    result: SearchResult,
    fetchOptions?: GetPerspectiveOptions
  ): Promise<void>;

  get(
    options: SearchOptions,
    fetchOptions?: GetPerspectiveOptions
  ): Promise<SearchResult | undefined>;

  clear(options: SearchOptions, fetchOptions?: GetPerspectiveOptions): Promise<void>;
}
