import { Dictionary } from 'lodash';

import { Provider } from '../sources/provider';
import PatternRegistry from '../../patterns/registry/pattern.registry';
import { KnownSourcesService } from '../known-sources/known-sources.service';
import { Source } from '../sources/source';

export class MultiProviderService<T extends Source> {
  providers!: Dictionary<Provider<T>>;

  initialization: Promise<void>;
  initCompleted: boolean = false;

  /**
   * @param patternRegistry the pattern registry to interact with the objects and their links
   * @param knownSources local service to store all known sources to be able to retrieve the object afterwards
   * @param providers dictionary of all providers from which to get objects
   */
  constructor(
    protected patternRegistry: PatternRegistry,
    protected localKnownSources: KnownSourcesService,
    providers: Array<Provider<T>>
  ) {
    this.initialization = this.initProviders(providers);
  }

  /**
   * Initialize the providers' sources by calling getOwnSource() on each provider
   *
   * @param providers
   * @returns a promise that resolves when all the sources have been initialized
   */
  private async initProviders(providers: Array<Provider<T>>): Promise<void> {
    // Get the name of each source
    const promises = providers.map(provider => provider.knownSources.getOwnSource());
    const sources = await Promise.all(promises);

    // Build the provider dictionary from the resulting names
    this.providers = sources.reduce(
      (providers, source, index) => ({ ...providers, [source]: providers[index] }),
      {}
    );

    // Set initialization completed
    this.initCompleted = true;
  }

  /**
   * @returns a promise that resolves when all the sources have been initialized
   */
  public ready(): Promise<void> {
    if (this.initCompleted) return Promise.resolve();
    else return this.initialization;
  }
}
