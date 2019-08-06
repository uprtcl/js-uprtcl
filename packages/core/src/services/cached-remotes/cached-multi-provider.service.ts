import { CacheService } from '../cache/cache.service';
import { Source } from '../sources/source';
import { MultiProviderService } from '../multi/multi-provider.service';
import { TaskQueue } from '../../utils/task.queue';
import { CachedProviderService } from './cached-provider.service';

export class CachedMultiProviderService<CACHE extends CacheService, REMOTE extends Source> extends CachedProviderService<CACHE, MultiProviderService<REMOTE>>{

  /**
   * Execute the creator function and wait for it in the cache,
   * schedule its execution in the given remote
   *
   * @param creator the creator function to execute
   * @param source the source to which to execute the function
   * @returns the optimistic id of the newly created object
   */
  public async optimisticCreateIn<O extends object, R extends object>(
    source: string,
    object: O,
    creator: (service: CACHE) => Promise<R>,
    cloner: (service: REMOTE, object: R) => Promise<any>
  ): Promise<R> {
    const multiCloner = (service: MultiProviderService<REMOTE>, createdObject: R) =>
      service.createIn(source, service => cloner(service, createdObject), createdObject);

    return this.optimisticCreate(object, creator, multiCloner);
  }

  /**
   * Execute the updater function and wait for it in the cache,
   * schedule its execution in the remote
   *
   * @param updater the updater function to execute
   * @returns the result of the optimistic update execution
   */
  public async optimisticUpdateIn<O>(
    source: string,
    object: object,
    cacheUpdater: (service: CACHE) => Promise<O>,
    remoteUpdater: (service: REMOTE) => Promise<O>,
    taskId: string,
    dependsOn: string | undefined
  ): Promise<O> {
    const multiRemoteUpdate = (service: MultiProviderService<REMOTE>) =>
      service.updateIn(source, remoteUpdater, object);
    return this.optimisticUpdate(cacheUpdater, multiRemoteUpdate, taskId, dependsOn);
  }
}
