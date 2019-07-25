import { MultiProviderService } from '../../src/services/multi/multi-provider.service';
import PatternRegistry from '../../src/patterns/registry/pattern.registry';
import { DefaultNodePattern } from '../../src/patterns/defaults/default-node.pattern';
import { KnownSourcesMock } from '../mocks/known-sources.mock';
import { CacheSourceMock } from '../mocks/cache-source.mock';
import { DiscoverableSource } from '../../src/services/sources/discoverable.source';

const object1 = {
  links: ['object2']
};

const initialB = {
  objects: {
    object2: {
      links: []
    }
  }
};

/**
 * MultiProviderService test
 */
describe('MultiProviderService test', () => {
  let multiProvider: MultiProviderService<CacheSourceMock>;
  let localKnownSources: KnownSourcesMock;
  let sourceA: DiscoverableSource<CacheSourceMock>;
  let sourceB: DiscoverableSource<CacheSourceMock>;

  beforeEach(() => {
    const patternRegistry = new PatternRegistry();
    patternRegistry.registerPattern('node', new DefaultNodePattern());

    localKnownSources = new KnownSourcesMock('local');
    sourceA = {
      knownSources: new KnownSourcesMock('sourceA'),
      source: new CacheSourceMock()
    };
    sourceB = {
      knownSources: new KnownSourcesMock('sourceB'),
      source: new CacheSourceMock(initialB.objects)
    };

    multiProvider = new MultiProviderService<CacheSourceMock>(patternRegistry, localKnownSources, [
      sourceA,
      sourceB
    ]);
  });

  it('update in one of the sources without knowning the sources of the link does not update its knownSourcesService', async () => {
    const spyKnownSourcesA = jest.spyOn(sourceA.knownSources, 'addKnownSources');

    await multiProvider.updateIn('sourceA', service => service.cache('object1', object1), object1);
    expect(spyKnownSourcesA).toHaveBeenCalledTimes(0);
  });

  it('update in one of the sources adds the links known sources to its knownSourcesService', async () => {
    await localKnownSources.addKnownSources('object2', ['sourceB']);

    const spyKnownSourcesA = jest.spyOn(sourceA.knownSources, 'addKnownSources');

    await multiProvider.updateIn('sourceA', service => service.cache('object1', object1), object1);
    expect(spyKnownSourcesA).toHaveBeenCalledTimes(1);
    expect(spyKnownSourcesA).toHaveBeenCalledWith('object2', ['sourceB']);
  });

  it('update in one of the sources does not add the links known sources to its knownSourcesService if it is the same source', async () => {
    await localKnownSources.addKnownSources('object2', ['sourceA']);

    const spyKnownSourcesA = jest.spyOn(sourceA.knownSources, 'addKnownSources');

    await multiProvider.updateIn('sourceA', service => service.cache('object1', object1), object1);
    expect(spyKnownSourcesA).toHaveBeenCalledTimes(0);
  });

  it("create adds the object to the local known sources and its links' known sources to the appropiate known sources service", async () => {
    // Clear mock objects
    sourceB.source.objects = {};

    const spyLocalKnownSources = jest.spyOn(localKnownSources, 'addKnownSources');

    await multiProvider.createIn(
      'sourceB',
      service => service.create('object2', initialB.objects.object2),
      initialB.objects.object2
    );

    expect(spyLocalKnownSources).toHaveBeenCalledTimes(1);
    expect(spyLocalKnownSources).toHaveBeenCalledWith('object2', ['sourceB']);

    const spyKnownSourcesA = jest.spyOn(sourceA.knownSources, 'addKnownSources');

    await multiProvider.createIn('sourceA', service => service.create('object1', object1), object1);

    expect(spyKnownSourcesA).toHaveBeenCalledTimes(1);
    expect(spyKnownSourcesA).toHaveBeenCalledWith('object2', ['sourceB']);
  });
});
