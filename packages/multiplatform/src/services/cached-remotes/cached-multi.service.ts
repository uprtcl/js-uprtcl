import { Hashed } from '@uprtcl/cortex';

import { CacheService } from '../cache/cache.service';
import { MultiService } from '../multi/multi.service';
import { CachedService } from './cached.service';
import { ServiceProvider } from '../sources/authority';

export class CachedMultiService<
  CACHE extends CacheService,
  REMOTE extends ServiceProvider,
  MULTI extends MultiService<REMOTE>
> extends CachedService<CACHE, MULTI> {
  /**
   * Execute the creator function and wait for it in the cache,
   * schedule its execution in the given remote
   *
   * @param upl the identifier of the service provider to execute the function in, can be undefined only if one service provider is present
   * @param creator the creator function to execute
   * @param cloner the cloner function create the object in the remote service
   * @returns the newly created object, along with its hash
   */
  public async optimisticCreateIn<O>(
    upl: string | undefined,
    creator: (service: CACHE) => Promise<Hashed<O>>,
    cloner: (service: REMOTE, object: Hashed<O>) => Promise<any>
  ): Promise<Hashed<O>> {
    const multiCloner = (service: MultiService<REMOTE>, createdObject: Hashed<O>) =>
      service.createIn(upl, service => cloner(service, createdObject));

    const hashed = await this.optimisticCreate(creator, multiCloner);

    if (upl) this.remote.localKnownSources.addKnownSources(hashed.id, [upl]);

    return hashed;
  }

  /**
   * Execute the updater function and wait for it in the cache,
   * schedule its execution in the remote
   *
   * @param upl the remote service to execute the function to
   * @param object the object that is being updated
   * @param cacheUpdater the updater function to execute in the local service
   * @param remoteUpdater the updater function to execute in the remote service
   * @param taskId the task id of this task, for other tasks to depend on it
   * @param dependsOn the task id that the remote async task depends on
   * @returns the result of the optimistic update execution
   */
  public async optimisticUpdateIn<O>(
    upl: string | undefined,
    object: object,
    cacheUpdater: (service: CACHE) => Promise<O>,
    remoteUpdater: (service: REMOTE) => Promise<O>,
    taskId: string,
    dependsOn: string | undefined
  ): Promise<O> {
    const multiRemoteUpdate = (service: MultiService<REMOTE>) =>
      service.updateIn(upl, remoteUpdater, object);
    return this.optimisticUpdate(cacheUpdater, multiRemoteUpdate, taskId, dependsOn);
  }
}
