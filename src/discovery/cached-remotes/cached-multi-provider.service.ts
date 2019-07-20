import { CacheService } from '../cache/cache.service';
import { Source } from '../sources/source';
import { CachedProviderService } from './cached-provider.service';
import { MultiProviderService } from '../multi/multi-provider.service';
import { CachedSourceService } from './cached-source.service';
import PatternRegistry from '../../patterns/registry/pattern.registry';
import { TaskQueue } from '../task.queue';
import { CreatePattern } from '../../patterns/patterns/create.pattern';
import { ClonePattern } from '../../patterns/patterns/clone.pattern';

export class CachedMultiProvider<
  C extends CacheService,
  REMOTE extends Source
> extends CachedSourceService {
  constructor(
    protected patternRegistry: PatternRegistry,
    public cache: C,
    public multiRemote: MultiProviderService<REMOTE>,
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
  public async optimisticCreate<O extends object, R>(object: O, source: string): Promise<R> {
    // First, create object in cache
    const pattern: CreatePattern<C, O, R> & ClonePattern<REMOTE, R> = this.patternRegistry.from(
      object
    );

    if (!pattern.hasOwnProperty('clone') || !pattern.hasOwnProperty('create')) {
      throw new Error('Object data schema has not clone and create pattern implemented');
    }

    const createdObject = await pattern.create(this.cache, object);

    this.logger.info(`Optimistically created object: ${createdObject}`);

    // Then schedule the same creation in the remote
    const task = async () => pattern.clone(this.multiRemote.getSource(source), createdObject);
    this.taskQueue.queueTask({ id: JSON.stringify(object), task: task });

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
    source: string,
    taskId: string,
    dependsOn: string | undefined
  ): Promise<O> {
    // First, execute the updater in the cache
    const result = await cacheUpdater(this.cache);

    this.logger.info(`Optimistically updated object, result: ${result}`);

    // Then schedule the same updater in the remote
    const task = async () => remoteUpdater(this.multiRemote.getSource(source));
    this.taskQueue.queueTask({ id: taskId, task: task, dependsOn: dependsOn });

    return result;
  }
}
