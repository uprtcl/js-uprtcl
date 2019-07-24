import { CacheSourceMock } from '../mocks/cache-source.mock';
import {
  CachedMultiProviderService,
  MultiProviderService,
  DiscoverableSource
} from '../../src/services';
import { TaskQueueMock } from '../mocks/task.queue.mock';
import PatternRegistry from '../../src/patterns/registry/pattern.registry';
import { DefaultNodePattern } from '../../src/patterns/defaults/default-node.pattern';
import { KnownSourcesMock } from '../mocks/known-sources.mock';

const object1 = {
  id: 'object1',
  links: ['object2']
};

/**
 * CachedMultiProviderService test
 */
describe('CachedMultiProviderService test', () => {
  let cachedMultiProvider: CachedMultiProviderService<CacheSourceMock, CacheSourceMock>;
  let cache: CacheSourceMock;
  let multiRemote: MultiProviderService<CacheSourceMock>;
  let sourceA: DiscoverableSource<CacheSourceMock>;
  let sourceB: DiscoverableSource<CacheSourceMock>;
  let localKnownSources: KnownSourcesMock;

  let spyCacheCreate: jest.SpyInstance;
  let spySourceACreate: jest.SpyInstance;
  let spySourceBCreate: jest.SpyInstance;
  let spyQueueTask: jest.SpyInstance;

  beforeEach(async () => {
    cache = new CacheSourceMock();

    const providerA = new CacheSourceMock();
    sourceA = {
      knownSources: new KnownSourcesMock('sourceA'),
      source: providerA
    };

    const providerB = new CacheSourceMock();
    sourceB = {
      knownSources: new KnownSourcesMock('sourceB'),
      source: providerB
    };

    const patternRegistry = new PatternRegistry();
    patternRegistry.registerPattern('node', new DefaultNodePattern());

    localKnownSources = new KnownSourcesMock('local');

    multiRemote = new MultiProviderService<CacheSourceMock>(patternRegistry, localKnownSources, [
      sourceA,
      sourceB
    ]);

    const taskQueue = new TaskQueueMock();
    spyQueueTask = jest.spyOn(taskQueue, 'queueTask');

    cachedMultiProvider = new CachedMultiProviderService<CacheSourceMock, CacheSourceMock>(
      cache,
      multiRemote,
      taskQueue as any
    );

    spyCacheCreate = jest.spyOn(cache, 'create');
    spySourceACreate = jest.spyOn(providerA, 'create');
    spySourceBCreate = jest.spyOn(providerB, 'create');
  });

  it('optimisticCreateIn executes in the cache and schedules task in the appropiate source', async done => {
    expect(
      await cachedMultiProvider.optimisticCreateIn(
        'sourceA',
        object1,
        async service => {
          await service.create('object1', object1);
          return object1;
        },
        (service, createdObject) => service.create('object1', object1)
      )
    ).toEqual({ id: 'object1', links: ['object2'] });

    expect(spyCacheCreate).toHaveBeenCalledTimes(1);
    expect(spySourceACreate).toHaveBeenCalledTimes(0);
    expect(spyQueueTask).toHaveBeenCalledTimes(1);

    setTimeout(() => {
      expect(sourceA.source.objects['object1']).toEqual({
        id: 'object1',
        links: ['object2']
      });
      expect(spySourceACreate).toHaveBeenCalledTimes(1);
      expect(spySourceBCreate).toHaveBeenCalledTimes(0);
      done();
    }, 1000);
  });

  it('optimisticUpdate executes in the cache and schedules task', async done => {
    expect(
      await cachedMultiProvider.optimisticUpdateIn(
        'sourceA',
        object1,
        service => service.create('object1', object1),
        service => service.create('object1', object1),
        'taskId',
        undefined
      )
    ).toBe('object1');

    expect(spyCacheCreate).toHaveBeenCalledTimes(1);
    expect(spySourceACreate).toHaveBeenCalledTimes(0);
    expect(spyQueueTask).toHaveBeenCalledTimes(1);

    setTimeout(() => {
      expect(sourceA.source.objects['object1']).toEqual({
        id: 'object1',
        links: ['object2']
      });

      expect(spySourceACreate).toHaveBeenCalledTimes(1);
      expect(spySourceBCreate).toHaveBeenCalledTimes(0);
      done();
    }, 1000);
  });
});
