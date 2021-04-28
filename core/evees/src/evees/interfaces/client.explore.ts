import { Client } from './client';
import { GetPerspectiveOptions, SearchOptions, SearchResult } from './types';

/** A ClientExplore is a Client that also indexes it content and can solve search queries */
export interface ClientExplore extends Client {
  readonly explore?: (
    searchOptions: SearchOptions,
    fetchOptions?: GetPerspectiveOptions
  ) => Promise<SearchResult>;
}
