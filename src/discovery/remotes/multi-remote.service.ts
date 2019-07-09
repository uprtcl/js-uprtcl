import { Dictionary } from 'lodash';
import { Provider } from './providers/provider';
import { KnownSourcesService } from './known-sources/known-sources.service';
import { Source } from './sources/source';
import EntityRegistry from '../../entity/entity-registry';
import { LinkedEntity } from '../../entity/linked.entity';

export class MultiRemoteService {
  /**
   * @param knownSources local service to store all known sources to be able to retrieve the object afterwards
   * @param providers dictionary of all providers from which to get objects
   */
  constructor(
    protected entityRegistry: EntityRegistry,
    protected localKnownSources: KnownSourcesService,
    protected providers: Dictionary<Provider>
  ) {}

  public getSource(source: string): Source {
    return this.providers[source].source;
  }

  public getAllSources(): Promise<string[]> {
    const promises = Object.keys(this.providers).map(provider =>
      this.providers[provider].knownSources.getOwnSource()
    );
    return Promise.all(promises);
  }

  /**
   * Retrieves the known sources for the given hash from the given source and stores them in the known sources service
   * @param hash the hash for which to discover the sources
   * @param source the source to ask for the known sources
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
  protected async getFromSource<T extends object>(
    hash: string,
    source: string
  ): Promise<T | undefined> {
    // Get the object from source
    const object = await this.getSource(source).get<T>(hash);

    if (object) {
      // Object retrieved, discover the source for its links
      const entity = this.entityRegistry.from<T, LinkedEntity<T>>(object);

      const links = await entity.getLinks();
      const promises = links.map(link => this.discoverKnownSources(link, source));

      await Promise.all(promises);
    } else {
      // Todo: remove from known source
    }

    return object;
  }

  /**
   * Tries to get the object from the given source and rejects if failed
   * @param hash the hash of the object
   * @param source the source to get the object from
   */
  protected async tryGetFromSource<T extends object>(hash: string, source: string): Promise<T> {
    const object = await this.getFromSource<T>(hash, source);

    if (object === undefined) {
      return Promise.reject();
    }

    return object;
  }

  /**
   * Retrieves the object with the given hash
   * @param hash the hash of the object to retrieve
   */
  public async discover<T extends object>(hash: string): Promise<T | undefined> {
    // Get the known sources for the object from the local
    const knownSources = await this.localKnownSources.getKnownSources(hash);

    let promises: Array<Promise<T>>;
    if (knownSources) {
      // Try to retrieve the object from any of the known sources

      promises = knownSources.map(source => this.tryGetFromSource<T>(hash, source));
    } else {
      // We had no known source for the hash, try to get the object from all the sources
      const allSources = await this.getAllSources();

      promises = allSources.map(async source => {
        const object = await this.tryGetFromSource<T>(hash, source);

        // Luckily we found the object in one of the sources, store it in the known sources
        await this.localKnownSources.addKnownSources(hash, [source]);
        return object;
      });
    }

    try {
      // Get first resolved object
      const object = await this.raceToSuccess<T>(promises);
      return object;
    } catch (e) {
      // All sources failed, return null;
      return undefined;
    }
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
