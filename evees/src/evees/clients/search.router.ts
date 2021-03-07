import { CASStore } from 'src/cas/interfaces/cas-store';
import { RemoteEvees } from '../interfaces/remote.evees';
import { SearchEngine } from '../interfaces/search.engine';
import { BaseRouter } from './base.router';
import { ParentAndChild, SearchOptions, SearchResult } from '../interfaces/types';

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
        return remote.searchEngine ? remote.searchEngine.explore(options) : { perspectiveIds: [] };
      })
    );
    // search results are concatenated
    let combinedResult: SearchResult = {
      perspectiveIds: [],
      slice: {
        entities: [],
        perspectives: [],
      },
      ended: !!all.map((r) => r.ended).find((e) => e !== true), // if ended is false there is any remote in which ended !== true
    };
    all.forEach((result) => {
      combinedResult.perspectiveIds.push(...result.perspectiveIds);
      if (combinedResult.slice) {
        if (result.slice) {
          combinedResult.slice.entities.push(...result.slice?.entities);
        }
        if (result.slice) {
          combinedResult.slice.perspectives.push(...result.slice.perspectives);
        }
      }
    });
    return combinedResult;
  }
}
