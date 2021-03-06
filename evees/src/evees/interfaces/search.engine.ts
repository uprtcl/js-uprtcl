import { GetPerspectiveOptions, ParentAndChild, SearchOptions, SearchResult, Slice } from './types';

export interface SearchEngine {
  explore(
    searchOptions: SearchOptions,
    fetchOptions?: GetPerspectiveOptions
  ): Promise<SearchResult>;
  /** inverse search, who's child is this?' */
  locate(perspectiveId: string, forks: boolean): Promise<ParentAndChild[]>;
  forks(perspectiveId: string): Promise<string[]>;
  proposals(perspectiveId: string): Promise<string[]>;
}
