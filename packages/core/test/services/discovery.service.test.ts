import { DiscoveryService, MultiSourceService } from '../../src/services';
import { CacheSourceMock } from '../mocks/cache-source.mock';
import  { PatternRegistry } from '../../src/patterns/registry/pattern.registry';
import { KnownSourcesMock } from '../mocks/known-sources.mock';

/**
 * DiscoveryService test
 */
describe('DiscoveryService test', () => {
  let discovery: DiscoveryService;
  let cache: CacheSourceMock;
  let multiRemote: MultiSourceService;
  let localKnownSources: KnownSourcesMock;

  beforeEach(() => {
    cache = new CacheSourceMock();
    const patternRegistry = new PatternRegistry();

    localKnownSources = new KnownSourcesMock('local');

    multiRemote = new MultiSourceService(patternRegistry, localKnownSources, []);

    discovery = new DiscoveryService(cache, multiRemote);
  });

  it('discover object', async () => {
    const source = {
      knownSources: new KnownSourcesMock('sourceA'),
      source: new CacheSourceMock({ object1: { links: [] } })
    };
    await multiRemote.addSources([source]);

    expect(await discovery.get('object1')).toEqual({ links: [] });
  });
});
