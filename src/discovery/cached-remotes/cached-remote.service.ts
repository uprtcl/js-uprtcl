import { CacheService } from '../cache/cache.service';
import { Source } from '../sources/source';
import { TaskQueue } from '../task.queue';
import { Logger } from '../../utils/logger';

export class CachedRemoteService<T> {
  logger = new Logger('CachedRemote');

  constructor(
    protected cache: T,
    protected remote: T,
    protected taskQueue: TaskQueue = new TaskQueue()
  ) {}

  /**
   * Execute the creator function and wait for it in the cache,
   * schedule its execution in the remote
   *
   * @param creator the creator function to execute
   * @returns the optimistic id of the newly created object
   */
  public async optimisticCreate(
    creator: (service: T, hash: string | undefined) => Promise<string>
  ): Promise<string> {
    // First, create object in cache
    const hash = await creator(this.cache, undefined);

    // Then schedule the same creation in the remote
    const task = async () => creator(this.remote, hash);
    this.taskQueue.queueTask({ id: hash, task: task });

    return hash;
  }

  /**
   * Execute the updater function and wait for it in the cache,
   * schedule its execution in the remote
   *
   * @param updater the updater function to execute
   * @returns the result of the optimistic update execution
   */
  public async optimisticUpdate<O>(
    updater: (service: T) => Promise<O>,
    taskId: string,
    dependsOn: string | undefined
  ): Promise<O> {
    // First, execute the updater in the cache
    const result = await updater(this.cache);

    // Then schedule the same updater in the remote
    const task = async () => updater(this.remote);
    this.taskQueue.queueTask({ id: taskId, task: task, dependsOn: dependsOn });

    return result;
  }
}
