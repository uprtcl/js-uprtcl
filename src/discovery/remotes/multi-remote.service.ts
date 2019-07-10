import { Dictionary } from 'lodash';

import { Provider } from './providers/provider';
import { KnownSourcesService } from './known-sources/known-sources.service';
import { Source } from './sources/source';
import EntityRegistry from '../../entity/registry/entity-registry';
import { LinkedEntity } from '../../entity/entities/linked.entity';

export class MultiRemoteService<T extends Source> implements Source {
  providers!: Dictionary<Provider<T>>;

  initialization: Promise<void>;
  initCompleted: boolean = false;

  /**
   * @param knownSources local service to store all known sources to be able to retrieve the object afterwards
   * @param providers dictionary of all providers from which to get objects
   */
  constructor(
    protected entityRegistry: EntityRegistry,
    protected localKnownSources: KnownSourcesService,
    providers: Array<Provider<T>>
  ) {
    this.initialization = this.initSources(providers);
  }

  /**
   * Initialize the providers' sources by calling getOwnSource() on each provider
   * @param providers
   */
  private async initSources(providers: Array<Provider<T>>): Promise<void> {
    const promises = providers.map(provider => provider.knownSources.getOwnSource());

    const sources = await Promise.all(promises);

    this.providers = sources.reduce(
      (providers, source, index) => ({ ...providers, [source]: providers[index] }),
      {}
    );
    this.initCompleted = true;
  }

  public ready(): Promise<void> {
    if (this.initCompleted) return Promise.resolve();
    else return this.initialization;
  }

  public getSource(source: string): Source {
    return this.providers[source].source;
  }

  public getAllSources(): string[] {
    return Object.keys(this.providers);
  }

  /**
   * Retrieves the known sources for the given hash from the given provider and stores them in the known sources service
   * @param hash the hash for which to discover the sources
   * @param provider the provider to ask for the known sources
   */
  protected async discoverKnownSources(hash: string, source: string): Promise<void> {
    const knownSourcesService = this.providers[source].knownSources;

    const sources = await knownSourcesService.getKnownSources(hash);

    if (sources) {
      await this.localKnownSources.addKnownSources(hash, sources);
    }
  }

  /**
   * Gets the object for the given hash from the given source
   * @param hash the object hash
   * @param source the source from which to get the object from
   */
  protected async getFromSource<O extends object>(
    hash: string,
    source: string
  ): Promise<O | undefined> {
    // Get the object from source
    const object = await this.getSource(source).get<O>(hash);

    if (object) {
      // Object retrieved, discover the sources for its links
      const entity = this.entityRegistry.from<O, LinkedEntity<O>>(object);

      const links = await entity.getLinks();
      const promises = links.map(link => this.discoverKnownSources(link, source));

      await Promise.all(promises);
    } else {
      // Object retrieval succeeded but object was not found,
      // remove from the known sources
      await this.localKnownSources.removeKnownSource(hash, source);
    }

    return object;
  }

  /**
   * Tries to get the object from the given source and rejects if failed
   * @param hash the hash of the object
   * @param source the source to get the object from
   */
  protected async tryGetFromSource<O extends object>(hash: string, source: string): Promise<O> {
    const object = await this.getFromSource<O>(hash, source);

    if (object === undefined) {
      return Promise.reject();
    }

    return object;
  }

  /**
   * Retrieves the object with the given hash
   * @param hash the hash of the object to retrieve
   */
  public async get<O extends object>(hash: string): Promise<O | undefined> {
    // Wait for the sources to have been initialized
    await this.ready();

    // Get the known sources for the object from the local
    const knownSources = await this.localKnownSources.getKnownSources(hash);

    let promises: Array<Promise<O>>;
    if (knownSources) {
      // Try to retrieve the object from any of the known sources

      promises = knownSources.map(source => this.tryGetFromSource<O>(hash, source));
    } else {
      // We had no known sources for the hash, try to get the object from all the sources
      const allSources = this.getAllSources();

      promises = allSources.map(async source => {
        const object = await this.tryGetFromSource<O>(hash, source);

        // Luckily we found the object in one of the sources, store it in the known sources
        await this.localKnownSources.addKnownSources(hash, [source]);
        return object;
      });
    }

    try {
      // Get first resolved object
      const object = await this.raceToSuccess<O>(promises);
      return object;
    } catch (e) {
      // All sources failed, return null;
      return undefined;
    }
  }

  /**
   * Executes the given update function on the given source,
   * adding the known sources of the given object links to the source
   *
   * @param object the object to create
   * @param updater the update function to execute in the source
   * @param source the source to execute the update function in
   */
  public async update<O extends object, S>(
    object: O,
    updater: (service: T) => Promise<S>,
    source: string
  ): Promise<S> {
    // Wait for the sources to have been initialized
    await this.ready();

    // Execute the updater callback in the source
    const provider = this.providers[source];
    const result = await updater(provider.source);

    // Add known sources of the object's links to the provider's known sources
    if (provider.knownSources) {
      // Build entity to get the object's links
      const entity: LinkedEntity<O> = this.entityRegistry.from(object);
      const links = await entity.getLinks();

      const promises = links.map(async link => {
        // We asume that we have stored the local known sources for the links from the object
        const sources = await this.localKnownSources.getKnownSources(link);

        if (sources) {
          await provider.knownSources.addKnownSources(link, sources);
        }
      });

      await Promise.all(promises);
    }

    return result;
  }

  /**
   * Creates the given object on the given source executing the given creator function,
   * adding the known sources of its links to the source
   *
   * @param object the object to create
   * @param creator the creator function to execute
   * @param source the source to create the object in
   */
  public async create<O extends object>(
    object: O,
    creator: (service: T) => Promise<string>,
    source: string
  ): Promise<string> {
    const hash = await this.update(object, creator, source);

    // We successfully created the object in the source, add to local known sources
    await this.localKnownSources.addKnownSources(hash, [source]);

    return hash;
  }

  /**
   * Execute the promises in parallel and return when the first promise resolves
   * Only reject if all promises rejected
   * @param promises array of promises to execute
   */
  private raceToSuccess<O>(promises: Array<Promise<O>>): Promise<O> {
    let numRejected = 0;

    return new Promise((resolve, reject) =>
      promises.forEach(promise =>
        promise.then(resolve).catch(() => {
          if (++numRejected === promises.length) reject();
        })
      )
    );
  }
}
