import { MultiSourceService } from '../../src/services/multi/multi-source.service';
import PatternRegistry from '../../src/patterns/registry/pattern.registry';
import { DefaultNodePattern } from '../../src/patterns/defaults/default-node.pattern';
import { KnownSourcesMock } from '../mocks/known-sources.mock';
import { CacheSourceMock } from '../mocks/cache-source.mock';
import { DiscoverableSource } from '../../src/services/sources/discoverable.source';

const initialSourceA = {
  objects: {
    object1: {
      links: ['object2']
    }
  },
  sources: {
    object2: ['sourceB']
  }
};

const initialSourceB = {
  objects: {
    object2: {
      links: []
    }
  },
  sources: {}
};

/**
 * MultiSourcesService test
 */
describe('MultiSourcesService test', () => {
  let multiSource: MultiSourceService;
  let localKnownSources: KnownSourcesMock;
  let sourceA: DiscoverableSource;
  let sourceB: DiscoverableSource;
  let spyOwnSourceA: jest.SpyInstance;
  let patternRegistry: PatternRegistry;

  beforeEach(() => {
    patternRegistry = new PatternRegistry();
    patternRegistry.registerPattern('node', new DefaultNodePattern());

    localKnownSources = new KnownSourcesMock('local');
    sourceA = {
      knownSources: new KnownSourcesMock('sourceA', initialSourceA.sources),
      source: new CacheSourceMock(initialSourceA.objects)
    };
    sourceB = {
      knownSources: new KnownSourcesMock('sourceB'),
      source: new CacheSourceMock(initialSourceB.objects)
    };

    spyOwnSourceA = jest.spyOn(sourceA.knownSources, 'getOwnSource');

    multiSource = new MultiSourceService(patternRegistry, localKnownSources, [sourceA, sourceB]);
  });

  it('initialization of the sources', async () => {
    expect(spyOwnSourceA).toHaveBeenCalledTimes(1);
    expect(multiSource.sources).toBeFalsy();

    await multiSource.ready();

    expect(multiSource.sources).toEqual({ sourceA: sourceA, sourceB: sourceB });
  });

  it('get object from the appropiate source when we know it', async () => {
    const spyA = jest.spyOn(sourceA.source, 'get');
    const spyB = jest.spyOn(sourceB.source, 'get');

    await localKnownSources.addKnownSources('object2', ['sourceB']);
    expect(await multiSource.get('object2')).toEqual({ links: [] });

    expect(spyA).toHaveBeenCalledTimes(0);
    expect(spyB).toHaveBeenCalledTimes(1);
  });

  it('get object from any source when we do not know it', async () => {
    const spyA = jest.spyOn(sourceA.source, 'get');
    const spyB = jest.spyOn(sourceB.source, 'get');
    const spyLocal = jest.spyOn(localKnownSources, 'addKnownSources');

    expect(await multiSource.get('object2')).toEqual({ links: [] });

    expect(spyA).toHaveBeenCalledTimes(1);
    expect(spyB).toHaveBeenCalledTimes(1);
    expect(spyLocal).toHaveBeenCalledWith('object2', ['sourceB']);
  });

  it('get object adds the known sources of the links to the local service', async () => {
    expect(await multiSource.get('object1')).toEqual({ links: ['object2'] });

    expect(localKnownSources.knownSources['object2']).toEqual(['sourceB']);

    const spyA = jest.spyOn(sourceA.source, 'get');
    const spyB = jest.spyOn(sourceB.source, 'get');

    expect(await multiSource.get('object2')).toEqual({ links: [] });

    expect(spyA).toHaveBeenCalledTimes(0);
    expect(spyB).toHaveBeenCalledTimes(1);
  });

  it('get from known source that returns undefined removes the known source from local service', async () => {
    await localKnownSources.addKnownSources('object2', ['sourceA']);

    const spy = jest.spyOn(localKnownSources, 'removeKnownSource');

    expect(await multiSource.get('object2')).toBeFalsy();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('add sources works', async () => {
    multiSource = new MultiSourceService(patternRegistry, localKnownSources, []);
    spyOwnSourceA = jest.spyOn(sourceA.knownSources, 'getOwnSource');
    jest.clearAllMocks();

    multiSource.addSources([sourceA, sourceB]);

    expect(spyOwnSourceA).toHaveBeenCalledTimes(1);
    expect(multiSource.sources).toBeFalsy();

    await multiSource.ready();

    expect(multiSource.sources).toEqual({ sourceA: sourceA, sourceB: sourceB });
  });
});
