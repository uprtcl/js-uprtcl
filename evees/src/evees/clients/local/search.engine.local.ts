import { Signed } from '../../../patterns/interfaces/signable';
import { SearchEngine } from '../../interfaces/search.engine';
import { SearchOptions, ParentAndChild, Perspective } from '../../interfaces/types';
import { RemoteEveesLocal } from './remote.local';

export class LocalSearchEngine implements SearchEngine {
  constructor(protected remote: RemoteEveesLocal) {}

  explore(options: SearchOptions) {
    throw new Error('Method not implemented.');
  }
  locate(perspectiveId: string, forks: boolean): Promise<ParentAndChild[]> {
    throw new Error('Method not implemented.');
  }
  async forks(perspectiveId: string): Promise<string[]> {
    const perspective = await this.remote.store.getEntity<Signed<Perspective>>(perspectiveId);
    const others = await this.remote.db.perspectives
      .where('context')
      .equals(perspective.object.payload.context)
      .toArray();
    return others.map((other) => other.id);
  }
  proposals(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
}
