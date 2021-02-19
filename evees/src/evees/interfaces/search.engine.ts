import { ParentAndChild, SearchOptions } from './types';

export interface SearchEngine {
  explore(options: SearchOptions): any;
  /** inverse search, who's child is this?' */
  locate(perspectiveId: string, forks: boolean): Promise<ParentAndChild[]>;
  forks(perspectiveId: string): Promise<string[]>;
}
