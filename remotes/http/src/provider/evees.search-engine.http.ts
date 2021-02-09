import { SearchEngine, SearchOptions, ParentAndChild } from '@uprtcl/evees';
import { HttpConnection } from '@uprtcl/http-provider';

export class EveesHttpSearchEngine implements SearchEngine {
  constructor(protected connection: HttpConnection) {}

  explore(options: SearchOptions) {
    throw new Error('Method not implemented.');
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
