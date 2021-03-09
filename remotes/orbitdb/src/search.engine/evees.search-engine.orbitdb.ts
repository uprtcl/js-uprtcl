import {
  SearchEngine,
  SearchOptions,
  ParentAndChild,
  CASStore,
  Perspective,
  Signed,
  SearchResult,
} from '@uprtcl/evees';
import { OrbitDBCustom } from '@uprtcl/orbitdb-provider';

import { EveesOrbitDBEntities } from '../custom-stores/orbit-db.stores';

/** A search engine service that indexes _Prtcl objects on OrbitDB */
export class EveesOrbitDBSearchEngine implements SearchEngine {
  constructor(public orbitdbcustom: OrbitDBCustom, protected store: CASStore) {}

  explore(options: SearchOptions): Promise<SearchResult> {
    throw new Error('Method not implemented.');
  }
  async locate(perspectiveId: string, forks = false): Promise<ParentAndChild[]> {
    throw new Error('Method not implemented.');
  }
  async forks(perspectiveId: string): Promise<string[]> {
    const perspective = await this.store.getEntity<Signed<Perspective>>(perspectiveId);
    const context = perspective.object.payload.context;
    const contextStore = await this.orbitdbcustom.getStore(EveesOrbitDBEntities.Context, {
      context,
    });
    const perspectiveIds = [...contextStore.values()];
    return perspectiveIds;
  }
  proposals(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
}
