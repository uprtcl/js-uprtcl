import { RemoteEvees } from '../interfaces/remote.evees';
import { SearchEngine } from '../interfaces/search.engine';

export class SearchEngineRouter implements SearchEngine {
  constructor(protected remotes: RemoteEvees[]) {}
  /** get all user perspectives on all registered remotes */

  async otherPerspectives(perspectiveId: string): Promise<string[]> {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.searchEngine ? remote.searchEngine.otherPerspectives(perspectiveId) : [];
      })
    );
    return Array.prototype.concat.apply([], all);
  }
  locate(uref: string[]): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  async proposals(perspectiveId: string): Promise<string[]> {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.proposals ? remote.proposals.getProposalsToPerspective(perspectiveId) : [];
      })
    );
    return Array.prototype.concat.apply([], all);
  }

  explore() {}
}
