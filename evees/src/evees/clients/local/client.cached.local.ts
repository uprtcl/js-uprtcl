import lodash from 'lodash-es';

import { Commit, EveesMutation, Perspective, SearchOptions } from '../../../evees/interfaces/types';
import { Signed } from '../../../patterns/interfaces/signable';
import { Entity } from '../../../cas/interfaces/entity';
import { CASStore } from '../../../cas/interfaces/cas-store';
import { CASLocal } from '../../../cas/stores/cas.local';
import { createCommit } from '../../../evees/default.perspectives';

import { Client } from '../../interfaces/client';
import { ClientCachedWithBase } from '../client.cached.with.base';

import { CacheLocal } from './cache.local';
import { LocalSearchEngine } from './search.engine.local';

export class ClientCachedLocal extends ClientCachedWithBase {
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
      if (!this.base) {
        throw new Error(`Base must be defined if not store is provided`);
      }
      this.store = new CASLocal('local', this.base.store, false);
    }

    this.cache = new CacheLocal(name, this.store);
    this.searchEngineLocal = new LocalSearchEngine((this.cache as CacheLocal).db);
  }

  /** returns an EveesMutation with the new perspectives and **last** update under a given page
   * created un the draftsEvees */
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

        const update = await this.cache.getLastUpdate(perspectiveId);
        if (update) {
          mutation.updates.push(update);
        }
      })
    );

    return mutation;
  }

  /** Overrides **
   * takes all changes under a given page, squash them as new commits and remove them from the drafts client */
  async flush(options?: SearchOptions) {
    await this.ready();

    const pageMutation = await this.diff(options);

    const allUpdates = pageMutation.newPerspectives
      .map((np) => np.update)
      .concat(pageMutation.updates);

    await Promise.all(
      allUpdates.map(async (update) => {
        if (!this.base) {
          throw new Error('base client not defined for flush');
        }

        const perspectiveId = update.perspectiveId;
        const newPerspective = pageMutation.newPerspectives.find(
          (np) => np.perspective.id === perspectiveId
        );

        /** keep everyhing except for the headId which was squashed */
        const newUpdate = lodash.cloneDeep(update);

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
          });

          const head = await this.base.store.storeEntity({
            object: headObject,
            remote: remoteId,
          });

          headId = head.id;
        }

        newUpdate.details.headId = headId;

        if (newPerspective !== undefined) {
          await this.base.newPerspective({
            perspective,
            update: newUpdate,
          });
        } else {
          /** just update the perspective data (no guardian update or anything) */
          await this.base.updatePerspective(newUpdate);
        }
      })
    );

    if (!this.base) {
      throw new Error('base client not defined for flush');
    }

    /** execute the changes on the base client */
    await this.base.flush();

    /** clean perspectives from the cache */
    await Promise.all(
      allUpdates.map(async (update) => this.cache.clearPerspective(update.perspectiveId))
    );
  }
}
