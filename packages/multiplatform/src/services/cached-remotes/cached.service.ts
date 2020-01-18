import { Logger } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';

import { TaskQueue } from '../../utils/task.queue';
import { Ready } from '../sources/authority';

export class CachedService<CACHE extends Ready, REMOTE extends Ready = CACHE>
  implements Ready {
  protected logger = new Logger('CachedProviderService');

  constructor(
    public cache: CACHE,
    public remote: REMOTE,
    protected taskQueue: TaskQueue = new TaskQueue()
  ) {}

  /**
   * @override
   */
  public async ready(): Promise<void> {
    await Promise.all([this.remote.ready(), this.cache.ready()]);
  }

  /**
   * Execute the creator function and wait for it in the cache,
   * schedule its execution in the remote
   *
   * @param creator the creator function to execute
   * @returns the optimistic id of the newly created object
   */
  public async optimisticCreate<O>(
    creator: (service: CACHE) => Promise<Hashed<O>>,
    cloner: (service: REMOTE, object: Hashed<O>) => Promise<any>
  ): Promise<Hashed<O>> {
    // First, create object in cache
    const createdObject: Hashed<O> = await creator(this.cache);
    this.logger.info(`Optimistically created object`, createdObject);

    // Then schedule the same creation in the remote
    const taskId = createdObject.id;
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
    cacheUpdater: (service: CACHE) => Promise<O>,
    remoteUpdater: (service: REMOTE) => Promise<O>,
    taskId: string,
    dependsOn: string | undefined
  ): Promise<O> {
    // First, execute the updater in the cache
    const result = await cacheUpdater(this.cache);

    this.logger.info(`Optimistically updated object, result`, result);

    // Then schedule the same updater in the remote
    const task = async () => remoteUpdater(this.remote);
    this.taskQueue.queueTask({ id: taskId, task: task, dependsOn: dependsOn });

    return result;
  }
}
