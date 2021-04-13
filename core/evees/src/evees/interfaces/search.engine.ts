import {
  ForkOf,
  GetPerspectiveOptions,
  ParentAndChild,
  SearchForkOptions,
  SearchOptions,
  SearchResult,
  Slice,
} from './types';

export interface SearchEngine {
  explore(
    searchOptions: SearchOptions,
    fetchOptions?: GetPerspectiveOptions
  ): Promise<SearchResult>;
  /** inverse search, who's child is this?' */
  locate(perspectiveId: string, forks: boolean): Promise<ParentAndChild[]>;
}
