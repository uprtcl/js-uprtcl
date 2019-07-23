import { CacheSourceMock } from '../mocks/cache-source.mock';
import { CachedProviderService } from '../../src/services/cached-remotes/cached-provider.service';
import { TaskQueueMock } from '../mocks/task.queue.mock';

const object1 = {
  id: 'object1',
  links: ['object2']
};

/**
 * CachedProviderService test
 */
describe('CachedProviderService test', () => {
  let cachedProvider: CachedProviderService<CacheSourceMock, CacheSourceMock>;
  let cache: CacheSourceMock;
  let remote: CacheSourceMock;
  let spyCacheGet: jest.SpyInstance;
  let spyCacheCreate: jest.SpyInstance;
  let spyRemoteCreate: jest.SpyInstance;
  let spyQueueTask: jest.SpyInstance;

  beforeEach(() => {
    cache = new CacheSourceMock();
    remote = new CacheSourceMock();

    spyCacheGet = jest.spyOn(cache, 'get');
    spyCacheCreate = jest.spyOn(cache, 'create');
    spyRemoteCreate = jest.spyOn(remote, 'create');

    const taskQueue = new TaskQueueMock();
    spyQueueTask = jest.spyOn(taskQueue, 'queueTask');

    cachedProvider = new CachedProviderService<CacheSourceMock, CacheSourceMock>(
      cache,
      remote,
      taskQueue as any
    );
  });

  it('optimisticCreate executes in the cache and schedules task', async done => {
    expect(
      await cachedProvider.optimisticCreate(
        object1,
        service => service.create('object1', object1),
        (service, createdObject) => service.create('object1', object1)
      )
    ).toBe('object1');

    expect(spyCacheCreate).toHaveBeenCalledTimes(1);
    expect(spyRemoteCreate).toHaveBeenCalledTimes(0);
    expect(spyQueueTask).toHaveBeenCalledTimes(1);

    setTimeout(() => {
      expect(spyRemoteCreate).toHaveBeenCalledTimes(1);
      done();
    }, 1000);
  });

  it('optimisticUpdate executes in the cache and schedules task', async done => {
    expect(
      await cachedProvider.optimisticUpdate(
        service => service.create('object1', object1),
        service => service.create('object1', object1),
        'taskId',
        undefined
      )
    ).toBe('object1');

    expect(spyCacheCreate).toHaveBeenCalledTimes(1);
    expect(spyRemoteCreate).toHaveBeenCalledTimes(0);
    expect(spyQueueTask).toHaveBeenCalledTimes(1);

    setTimeout(() => {
      expect(spyRemoteCreate).toHaveBeenCalledTimes(1);
      done();
    }, 1000);
  });
});
