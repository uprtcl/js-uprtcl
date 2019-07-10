import { CacheService } from '../cache/cache.service';
import { Source } from './sources/source';
import { TaskQueue } from '../task.queue';
import { Logger } from '../../logger';

export class CachedRemote<T, C extends CacheService & T, R extends Source & T> implements Source {
  logger = new Logger('CachedRemote');

  constructor(
    protected cache: C,
    protected remote: R,
    protected taskQueue: TaskQueue = new TaskQueue()
  ) {}

  /**
   * Get the object identified by the given hash from cache or from remote
   * @param hash the hash identifying the object
   */
  public async get<O extends object>(hash: string): Promise<O | undefined> {
    // If we have the object in the cache, return it
    let object = await this.cache.get<O>(hash);
    if (object) {
      return object;
    }

    // We don't have the object in cache, get from remote and cache it
    object = await this.remote.get<O>(hash);
    if (object) {
      await this.cache.cache<O>(hash, object);
    }

    return object;
  }

  /**
   * Execute the creator function and wait for it in the cache,
   * schedule its execution in the remote
   *
   * @param creator the creator function to execute
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
   */
  public async optimisticUpdate(
    updater: (service: T) => Promise<string>,
    taskId: string,
    dependsOn: string | undefined
  ): Promise<string> {
    // First, execute the updater in the cache
    const hash = await updater(this.cache);

    // Then schedule the same updater in the remote
    const task = async () => updater(this.remote);
    this.taskQueue.queueTask({ id: taskId, task: task, dependsOn: dependsOn });

    return hash;
  }
}
