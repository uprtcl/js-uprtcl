import { CacheService } from '../cache/cache.service';
import { MultiService } from '../multi/multi.service';
import { CachedService } from './cached.service';
import { NamedRemote } from '../sources/named.source';
import { Hashed } from '../../patterns/properties/hashable';

export class CachedMultiService<
  CACHE extends CacheService,
  REMOTE extends NamedRemote,
  MULTI extends MultiService<REMOTE>
> extends CachedService<CACHE, MULTI> {
  /**
   * Execute the creator function and wait for it in the cache,
   * schedule its execution in the given remote
   *
   * @param sourceName the source to execute the function in
   * @param creator the creator function to execute
   * @param cloner the cloner function create the object in the remote service
   * @returns the newly created object, along with its hash
   */
  public async optimisticCreateIn<O>(
    sourceName: string,
    creator: (service: CACHE) => Promise<Hashed<O>>,
    cloner: (service: REMOTE, object: Hashed<O>) => Promise<any>
  ): Promise<Hashed<O>> {
    const multiCloner = (service: MultiService<REMOTE>, createdObject: Hashed<O>) =>
      service.createIn(sourceName, service => cloner(service, createdObject));

    return this.optimisticCreate(creator, multiCloner);
  }

  /**
   * Execute the updater function and wait for it in the cache,
   * schedule its execution in the remote
   *
   * @param updater the updater function to execute
   * @returns the result of the optimistic update execution
   */
  public async optimisticUpdateIn<O>(
    sourceName: string,
    object: object,
    cacheUpdater: (service: CACHE) => Promise<O>,
    remoteUpdater: (service: REMOTE) => Promise<O>,
    taskId: string,
    dependsOn: string | undefined
  ): Promise<O> {
    const multiRemoteUpdate = (service: MultiService<REMOTE>) =>
      service.updateIn(sourceName, remoteUpdater, object);
    return this.optimisticUpdate(cacheUpdater, multiRemoteUpdate, taskId, dependsOn);
  }
}
