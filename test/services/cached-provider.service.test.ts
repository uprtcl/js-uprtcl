import { CacheSourceMock } from '../mocks/cache-source.mock';
import { CachedProviderService } from '../../src/services/cached-remotes/cached-provider.service';
import { TaskQueueMock } from '../mocks/task.queue.mock';
import { TaskQueue } from '../../src/utils/task.queue';

/**
 * CachedProviderService test
 */
describe('CachedProviderService test', () => {
  let cachedProvider: CachedProviderService<CacheSourceMock, CacheSourceMock, CacheSourceMock>;
  let cache: CacheSourceMock;
  let remote: CacheSourceMock;

  beforeEach(() => {
    cache = new CacheSourceMock();
    remote = new CacheSourceMock();

    cachedProvider = new CachedProviderService<CacheSourceMock, CacheSourceMock, CacheSourceMock>(
      cache,
      remote,
      new TaskQueueMock() as TaskQueue
    );
  });
});
