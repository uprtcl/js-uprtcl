import { CacheSourceMock } from '../mocks/cache-source.mock';
import { CachedProviderService } from '../../src/services/cached-remotes/cached-provider.service';
import { TaskQueueMock } from '../mocks/task.queue.mock';

const object1 = {
  links: ['object2']
};

/**
 * CachedProviderService test
 */
describe('CachedProviderService test', () => {
  let cachedProvider: CachedProviderService<CacheSourceMock, CacheSourceMock, CacheSourceMock>;
  let cache: CacheSourceMock;
  let remote: CacheSourceMock;
  let spyCacheGet: jest.SpyInstance;
  let spyCacheCreate: jest.SpyInstance;
  let spyRemoteGet: jest.SpyInstance;
  let spyQueueTask: jest.SpyInstance;

  beforeEach(() => {
    cache = new CacheSourceMock();
    remote = new CacheSourceMock();

    spyCacheGet = jest.spyOn(cache, 'get');
    spyCacheCreate = jest.spyOn(cache, 'create');
    spyRemoteGet = jest.spyOn(remote, 'get');

    const taskQueue = new TaskQueueMock();
    spyQueueTask = jest.spyOn(taskQueue, 'queueTask');

    cachedProvider = new CachedProviderService<CacheSourceMock, CacheSourceMock, CacheSourceMock>(
      cache,
      remote,
      taskQueue as any
    );
  });

  it('optimisticCreate executes in the cache and schedules task', async () => {
    expect(
      cachedProvider.optimisticCreate(
        object1,
        service => service.create('object1', object1),
        service => service.create('object1', object1)
      )
    ).toBe('object1');

    expect(spyCacheCreate).toHaveBeenCalledTimes(1);
    expect(spyRemoteGet).toHaveBeenCalledTimes(0);
    expect(spyQueueTask).toHaveBeenCalledTimes(1);
  });
});
