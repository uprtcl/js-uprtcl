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
 * Multi-Sources test
 */
describe('Multi-Sources test', () => {
  let multiSource: MultiSourceService;
  let localKnownSources: KnownSourcesMock;
  let sourceA: DiscoverableSource;
  let sourceB: DiscoverableSource;

  beforeEach(() => {
    const patternRegistry = new PatternRegistry();
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

    multiSource = new MultiSourceService(patternRegistry, localKnownSources, [sourceA, sourceB]);
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

    expect(await multiSource.get('object2')).toEqual({ links: [] });
    expect(spyA).toHaveBeenCalledTimes(1);
    expect(spyB).toHaveBeenCalledTimes(1);
  });

  it('get object adds the known sources to the local service', async () => {
    expect(await multiSource.get('object1')).toEqual({ links: ['object2'] });

    const spyA = jest.spyOn(sourceA.source, 'get');
    const spyB = jest.spyOn(sourceB.source, 'get');

    expect(await multiSource.get('object2')).toEqual({ links: [] });

    expect(spyA).toHaveBeenCalledTimes(0);
    expect(spyB).toHaveBeenCalledTimes(1);
  });
});
