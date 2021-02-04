import { SearchEngine } from '@uprtcl/evees';
import { SearchOptions } from '@uprtcl/evees';
import { HttpConnectionLogged } from '@uprtcl/http-provider';

export class EveesHttpSearchEngine implements SearchEngine {
  constructor(protected connection: HttpConnectionLogged) {}

  explore(options: SearchOptions) {
    throw new Error('Method not implemented.');
  }
  async locate(perspectiveId: string, forks = false): Promise<string[]> {
    return this.connection.getWithPut<string[]>('/locate', {
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
