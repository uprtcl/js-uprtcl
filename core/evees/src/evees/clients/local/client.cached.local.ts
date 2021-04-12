import { CASStore } from '../../../cas/interfaces/cas-store';
import { CASLocal } from '../../../cas/stores/cas.local';
import { Logger } from '../../../utils/logger';

import { EveesMutation, SearchOptions } from '../../interfaces/types';
import { Client } from '../../interfaces/client';
import { ClientCachedWithBase } from '../client.cached.with.base';

import { CacheLocal } from './cache.local';
import { LocalSearchEngine } from './search.engine.local';
import { CondensateCommits, getMutationEntitiesIds } from 'src/evees/evees.utils';

const LOGINFO = false;

export class ClientCachedLocal extends ClientCachedWithBase {
  logger = new Logger('ClientCachedLocal');

  constructor(
    store?: CASStore,
    readonly base?: Client,
    readonly readCacheEnabled: boolean = true,
    readonly name: string = 'local'
  ) {
    super(base, `${name}-client`, readCacheEnabled);

    if (store) {
      this.store = store;
    } else {
      if (this.base) {
        this.store = new CASLocal('local', this.base.store, false);
      }
    }

    this.cache = new CacheLocal(name, this.store);
    this.searchEngineLocal = new LocalSearchEngine(this.cacheLocal.db);
  }

  /** retype cache as CacheLocal */
  get cacheLocal() {
    return this.cache as CacheLocal;
  }

  setStore(store: CASStore) {
    this.store = store;
    (this.cache as CacheLocal).setStore(store);
  }

  /** returns an EveesMutation with the new perspectives and **last** update under a given page
   * created in this client draftsEvees */
  async diff(options?: SearchOptions): Promise<EveesMutation> {
    await this.ready();

    if (!this.searchEngine) {
      throw new Error('searchEngine undefined');
    }

    const { perspectiveIds } = await this.searchEngine.explore(options || {});

    const mutation: EveesMutation = {
      newPerspectives: [],
      updates: [],
      entities: [],
      deletedPerspectives: [],
    };

    await Promise.all(
      perspectiveIds.map(async (perspectiveId) => {
        const newPerspective = await this.cache.getNewPerspective(perspectiveId);
        if (newPerspective) {
          mutation.newPerspectives.push(newPerspective);
        }

        /** returns the last update only */
        const updates = await this.cache.getUpdatesOf(perspectiveId);

        const condensate = new CondensateCommits(this.store, updates, LOGINFO);
        await condensate.init();

        const squahedUpdates = await condensate.condensate();
        mutation.updates.push(...squahedUpdates);
      })
    );

    if (LOGINFO) this.logger.log('diff', { options, perspectiveIds, mutation });

    return mutation;
  }

  /** Overrides **
   * takes all changes under a given page, squash them as new commits
   * and remove them from the drafts client */
  async flush(options?: SearchOptions) {
    const mutation = await this.diff(options);

    const entitiesIds = await getMutationEntitiesIds(mutation, this.store);
    const { entities } = await this.store.getEntities(entitiesIds);
    mutation.entities = entities;

    if (!this.base) throw new Error('base not defined');

    await this.base.store.storeEntities(mutation.entities);

    await Promise.all(
      mutation.newPerspectives.map((newPerspective) =>
        (this.base as Client).newPerspective(newPerspective)
      )
    );
    await Promise.all(
      mutation.updates.map((update) => (this.base as Client).updatePerspective(update))
    );

    if (!this.base) {
      throw new Error('base client not defined for flush');
    }

    /** execute the changes on the base client */
    await this.base.flush(options, true);

    /** clean perspectives from the cache */
    // await Promise.all(
    //   mutation.newPerspectives.map((newPerspective) =>
    //     this.cache.clearPerspective(newPerspective.perspective.id)
    //   )
    // );

    // await Promise.all(
    //   mutation.updates.map((update) => this.cache.clearPerspective(update.perspectiveId))
    // );
  }
}
