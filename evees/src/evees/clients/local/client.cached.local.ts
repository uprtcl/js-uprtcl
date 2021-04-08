import lodash from 'lodash-es';

import {
  Commit,
  EveesMutation,
  Perspective,
  SearchOptions,
  Update,
} from '../../../evees/interfaces/types';
import { Signed } from '../../../patterns/interfaces/signable';
import { Entity } from '../../../cas/interfaces/entity';
import { CASStore } from '../../../cas/interfaces/cas-store';
import { CASLocal } from '../../../cas/stores/cas.local';
import { createCommit } from '../../../evees/default.perspectives';
import { Logger } from '../../../utils/logger';

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

        const condensate = new CondensateCommits(this.store, updates);
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

    const { entities } = await this.store.getEntities(getMutationEntitiesIds(mutation));
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
    await Promise.all(
      mutation.newPerspectives.map((newPerspective) =>
        this.cache.clearPerspective(newPerspective.perspective.id)
      )
    );

    await Promise.all(
      mutation.updates.map((update) => this.cache.clearPerspective(update.perspectiveId))
    );
  }

  async squashUpdate(update: Update, onHead?: string): Promise<Update> {
    if (!this.base) {
      throw new Error('base client not defined for flush');
    }

    const perspectiveId = update.perspectiveId;

    let data: Entity<any> | undefined = undefined;

    if (update.details.headId) {
      const head = await this.store.getEntity<Signed<Commit>>(update.details.headId);
      data = head ? await this.store.getEntity<any>(head.object.payload.dataId) : undefined;
    }

    const perspective = await this.store.getEntity<Signed<Perspective>>(perspectiveId);
    const remoteId = perspective.object.payload.remote;

    await this.base.store.storeEntity(perspective);

    let headId: string | undefined = undefined;

    if (data) {
      const dataId = await this.base.store.storeEntity({
        object: data.object,
        remote: remoteId,
      });

      const headObject = await createCommit({
        dataId: dataId.id,
        parentsIds: onHead ? [onHead] : undefined,
      });

      const head = await this.base.store.storeEntity({
        object: headObject,
        remote: remoteId,
      });

      headId = head.id;

      if (LOGINFO) this.logger.log('squashUpdate', { update, data, head });
    }

    /** keep everyhing except for the headId which was squashed */
    const newUpdate = lodash.cloneDeep(update);
    newUpdate.details.headId = headId;

    if (LOGINFO) this.logger.log('squashUpdate - newUpdate', { newUpdate });

    return newUpdate;
  }
}
