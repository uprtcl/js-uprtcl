import { CacheSourceMock } from '../mocks/cache-source.mock';
import { CachedSourceService } from '../../src/services/cached-remotes/cached-source.service';

const object1 = {
  links: ['object2']
};

/**
 * CachedSourceService test
 */
describe('CachedSourceService test', () => {
  let cachedSource: CachedSourceService;
  let cache: CacheSourceMock;
  let remote: CacheSourceMock;
  let spyCacheGet: jest.SpyInstance;
  let spyCacheCache: jest.SpyInstance;
  let spyRemoteGet: jest.SpyInstance;

  beforeEach(() => {
    cache = new CacheSourceMock();
    remote = new CacheSourceMock();

    spyCacheGet = jest.spyOn(cache, 'get');
    spyCacheCache = jest.spyOn(cache, 'cache');
    spyRemoteGet = jest.spyOn(remote, 'get');

    cachedSource = new CachedSourceService(cache, remote);
  });

  it('get a non existent object returns undefined', async () => {
    expect(await cachedSource.get('object1')).toBeFalsy();

    expect(spyCacheGet).toHaveBeenCalledTimes(1);
    expect(spyRemoteGet).toHaveBeenCalledTimes(1);
    expect(spyCacheCache).toHaveBeenCalledTimes(0);
  });

  it('get an existent object in the remote returns the object and caches it', async () => {
    remote.objects['object1'] = object1;

    expect(await cachedSource.get('object1')).toEqual(object1);

    expect(spyCacheGet).toHaveBeenCalledTimes(1);
    expect(spyRemoteGet).toHaveBeenCalledTimes(1);
    expect(spyCacheCache).toHaveBeenCalledTimes(1);
  });

  it('get an existent object in the cache returns the object without calling the remote', async () => {
    cache.objects['object1'] = object1;

    expect(await cachedSource.get('object1')).toEqual(object1);

    expect(spyCacheGet).toHaveBeenCalledTimes(1);
    expect(spyRemoteGet).toHaveBeenCalledTimes(0);
    expect(spyCacheCache).toHaveBeenCalledTimes(0);
  });
});
