import { RemoteEvees } from '../interfaces/remote.evees';
import { SearchEngine } from '../interfaces/search.engine';
import { SearchOptions } from '../interfaces/types';

export class SearchEngineRouter implements SearchEngine {
  constructor(protected remotes: RemoteEvees[]) {}

  async forks(perspectiveId: string): Promise<string[]> {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.searchEngine ? remote.searchEngine.forks(perspectiveId) : [];
      })
    );
    return Array.prototype.concat.apply([], all);
  }
  async locate(perspectiveId: string, forks: boolean): Promise<string[]> {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.searchEngine ? remote.searchEngine.locate(perspectiveId, forks) : [];
      })
    );
    return Array.prototype.concat.apply([], all);
  }
  async proposals(perspectiveId: string): Promise<string[]> {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.searchEngine ? remote.searchEngine.proposals(perspectiveId) : [];
      })
    );
    return Array.prototype.concat.apply([], all);
  }
  async explore(options: SearchOptions) {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.searchEngine ? remote.searchEngine.explore(options) : [];
      })
    );
    return Array.prototype.concat.apply([], all);
  }
}
