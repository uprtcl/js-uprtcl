import { CASStore } from 'src/cas/interfaces/cas-store';
import { RemoteEvees } from '../interfaces/remote.evees';
import { SearchEngine } from '../interfaces/search.engine';
import { ParentAndChild, SearchOptions } from '../interfaces/types';
import { BaseRouter } from './base.router';

export class SearchEngineRouter extends BaseRouter implements SearchEngine {
  constructor(protected remotes: RemoteEvees[], protected store: CASStore) {
    super(remotes, store);
  }

  async forks(perspectiveId: string): Promise<string[]> {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.searchEngine ? remote.searchEngine.forks(perspectiveId) : [];
      })
    );
    return Array.prototype.concat.apply([], all);
  }
  async locate(perspectiveId: string, forks: boolean): Promise<ParentAndChild[]> {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.searchEngine ? remote.searchEngine.locate(perspectiveId, forks) : [];
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
