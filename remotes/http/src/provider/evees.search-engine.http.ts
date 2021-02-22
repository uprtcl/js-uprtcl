import {
  SearchEngine,
  SearchOptions,
  ParentAndChild,
  SearchResult,
  GetPerspectiveOptions,
} from '@uprtcl/evees';
import { HttpConnection } from '@uprtcl/http-provider';

export class EveesHttpSearchEngine implements SearchEngine {
  constructor(protected connection: HttpConnection) {}

  explore(
    searchOptions: SearchOptions,
    fetchOptions: GetPerspectiveOptions = {
      levels: 0,
      entities: true,
    }
  ) {
    return this.connection.getWithPut<SearchResult>('/explore', {
      searchOptions: searchOptions,
      fetchOptions: fetchOptions,
    });
  }
  async locate(perspectiveId: string, forks = false): Promise<ParentAndChild[]> {
    return this.connection.getWithPut<ParentAndChild[]>('/locate', {
      elementId: perspectiveId,
      forks,
    });
  }
  forks(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  proposals(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
}
