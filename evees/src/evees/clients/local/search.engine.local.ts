import { SearchEngine } from '../../interfaces/search.engine';
import { SearchOptions, ParentAndChild } from '../../interfaces/types';

export class LocalSearchEngine implements SearchEngine {
  explore(options: SearchOptions) {
    throw new Error('Method not implemented.');
  }
  locate(perspectiveId: string, forks: boolean): Promise<ParentAndChild[]> {
    throw new Error('Method not implemented.');
  }
  forks(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  proposals(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
}
