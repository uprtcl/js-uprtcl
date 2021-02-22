import { RemoteEvees } from '../interfaces/remote.evees';
import { SearchEngine } from '../interfaces/search.engine';
import { ParentAndChild, SearchOptions, SearchResult } from '../interfaces/types';

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
  async locate(perspectiveId: string, forks: boolean): Promise<ParentAndChild[]> {
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
  async explore(options: SearchOptions): Promise<SearchResult> {
    const allResults = await Promise.all(
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
    };
    allResults.forEach((result) => {
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
