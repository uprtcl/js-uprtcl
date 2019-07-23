import { TaskQueue } from '../../utils/task.queue';
import { Source } from '../sources/source';
import { CachedSourceService } from './cached-source.service';
import { CacheService } from '../cache/cache.service';

export class CachedProviderService<
  C extends CacheService,
  REMOTE extends Source
> extends CachedSourceService {
  constructor(
    public cache: C,
    public remote: REMOTE,
    protected taskQueue: TaskQueue = new TaskQueue()
  ) {
    super(cache, remote);
  }

  /**
   * Execute the creator function and wait for it in the cache,
   * schedule its execution in the remote
   *
   * @param creator the creator function to execute
   * @returns the optimistic id of the newly created object
   */
  public async optimisticCreate<O extends object, R>(
    object: O,
    creator: (service: C) => Promise<R>,
    cloner: (service: REMOTE, object: R) => Promise<any>
  ): Promise<R> {
    // First, create object in cache
    const createdObject = await creator(this.cache);

    this.logger.info(`Optimistically created object: ${createdObject}`);

    // Then schedule the same creation in the remote
    const taskId = object['id'] ? object['id'] : JSON.stringify(object);
    const task = async () => cloner(this.remote, createdObject);
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
  public async optimisticUpdate<O>(
    cacheUpdater: (service: C) => Promise<O>,
    remoteUpdater: (service: REMOTE) => Promise<O>,
    taskId: string,
    dependsOn: string | undefined
  ): Promise<O> {
    // First, execute the updater in the cache
    const result = await cacheUpdater(this.cache);

    this.logger.info(`Optimistically updated object, result: ${result}`);

    // Then schedule the same updater in the remote
    const task = async () => remoteUpdater(this.remote);
    this.taskQueue.queueTask({ id: taskId, task: task, dependsOn: dependsOn });

    return result;
  }
}
