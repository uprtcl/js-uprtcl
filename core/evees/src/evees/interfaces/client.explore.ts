import { Client } from './client';
import { GetPerspectiveOptions, SearchOptions, SearchResult } from './types';

/** A ClientExplore is a Client that also indexes its content and can solve search queries
 * using UglyQL (the query structure that is used by _Prtcl). */
export interface ClientExplore extends Client {
  readonly explore: (
    searchOptions: SearchOptions,
    fetchOptions?: GetPerspectiveOptions
  ) => Promise<SearchResult>;
}
