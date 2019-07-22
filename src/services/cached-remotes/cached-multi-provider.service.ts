import { CacheService } from '../cache/cache.service';
import { Source } from '../sources/source';
import { MultiProviderService } from '../multi/multi-provider.service';
import { CachedSourceService } from './cached-source.service';
import PatternRegistry from '../../patterns/registry/pattern.registry';
import { TaskQueue } from '../task.queue';

export class CachedMultiProviderService<
  T extends Source,
  C extends CacheService & T
> extends CachedSourceService {
  constructor(
    protected patternRegistry: PatternRegistry,
    public cache: C,
    public multiRemote: MultiProviderService<T>,
    protected taskQueue: TaskQueue = new TaskQueue()
  ) {
    super(cache, multiRemote);
  }

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
    creator: (service: T) => Promise<R>,
    cloner: (service: T, object: R) => Promise<any>
  ): Promise<R> {
    // First, create object in cache
    const createdObject = await creator(this.cache);
    this.logger.info(`Optimistically created object: ${createdObject}`);

    // Then schedule the clone operation in the remote
    const task = async () =>
      this.multiRemote.createIn(source, service => cloner(service, createdObject), createdObject);

    const taskId = object['id'] ? object['id'] : JSON.stringify(object);
    this.taskQueue.queueTask({ id: taskId, task: task });

    return createdObject;
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
    cacheUpdater: (service: C) => Promise<O>,
    remoteUpdater: (service: T) => Promise<O>,
    taskId: string,
    dependsOn: string | undefined
  ): Promise<O> {
    // First, execute the updater in the cache
    const result = await cacheUpdater(this.cache);

    this.logger.info(`Optimistically updated object, result: ${result}`);

    // Then schedule the same updater in the remote
    const task = async () =>
      this.multiRemote.updateIn(source, service => remoteUpdater(service), object);

    this.taskQueue.queueTask({ id: taskId, task: task, dependsOn: dependsOn });

    return result;
  }
}
