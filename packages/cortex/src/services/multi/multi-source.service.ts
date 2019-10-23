import { multiInject, inject, injectable } from 'inversify';
import { Dictionary } from 'lodash';

import { Source } from '../sources/source';
import { HasLinks } from '../../patterns/properties/has-links';
import { DiscoverableSource } from '../sources/discoverable.source';
import { KnownSourcesService } from '../known-sources/known-sources.service';
import { PatternRecognizer } from '../../patterns/recognizer/pattern.recognizer';
import { Hashed } from '../../patterns/properties/hashable';
import { NamedSource } from '../sources/named.source';
import { PatternTypes, DiscoveryTypes } from '../../types';
import { Logger } from '@uprtcl/micro-orchestrator';

@injectable()
export class MultiSourceService<T extends NamedSource = NamedSource> implements Source {
  protected logger = new Logger('MultiSourceService');

  sources: Dictionary<DiscoverableSource<T>>;

  /**
   * @param patternRecognizer the pattern recognizer to interact with the objects and their links
   * @param localKnownSources local service to store all known sources to be able to retrieve the object afterwards
   * @param discoverableSources array of all discoverable sources from which to get objects
   */
  constructor(
    @inject(PatternTypes.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(DiscoveryTypes.LocalKnownSources)
    protected localKnownSources: KnownSourcesService,
    @multiInject(DiscoveryTypes.DiscoverableSource)
    discoverableSources: Array<DiscoverableSource<T>>
  ) {
    // Build the sources dictionary from the resulting names
    this.sources = discoverableSources.reduce(
      (sources, source) => ({ ...sources, [source.source.name]: source }),
      {}
    );
  }

  /**
   * @override
   */
  public async ready(): Promise<void> {
    const promises = Object.keys(this.sources).map(sourceName =>
      this.sources[sourceName].source.ready()
    );
    await Promise.all(promises);
  }

  /**
   * Gets the source with the given name
   *
   * @param sourceName the name of the source
   * @returns the source identified with the given name
   */
  public getSource(sourceName: string): DiscoverableSource<T> | undefined {
    const namedSourceName = Object.keys(this.sources).find(name =>
      this.sources[name].source.configure(sourceName)
    );

    if (!namedSourceName) {
      return undefined;
    }

    return this.sources[namedSourceName];
  }

  /**
   * @returns gets the names of all the sources
   */
  public getAllSourcesNames(): string[] {
    return Object.keys(this.sources);
  }

  /**
   * @returns gets all the sources
   */
  public getAllSources(): T[] {
    return Object.keys(this.sources).map(sourceName => this.sources[sourceName].source);
  }

  /**
   * Retrieves the known sources for the given hash from the given source and stores them in the known sources service
   * @param hash the hash for which to discover the sources
   * @param source the source to ask for the known sources
   */
  protected async discoverKnownSources(hash: string, source: DiscoverableSource<T>): Promise<void> {
    const knownSourcesNames = await source.knownSources.getKnownSources(hash);

    if (knownSourcesNames) {
      await this.localKnownSources.addKnownSources(hash, knownSourcesNames);
    }
  }

  protected async linksFromObject<O extends object>(object: O): Promise<string[]> {
    // Object retrieved, discover the sources for its links
    const pattern = this.patternRecognizer.recognizeMerge(object) as HasLinks;

    return pattern.getLinks ? pattern.getLinks(object) : [];
  }

  public async getGenericFromSource<R>(
    sourceName: string,
    getter: (service: T) => Promise<R | undefined>,
    linksSelector: (object: R) => Promise<string[]>
  ): Promise<R | undefined> {
    const source = this.getSource(sourceName);

    if (!source) {
      this.logger.warn(`No source was found for name ${sourceName}`);
      return;
    }

    // Execute the getter
    const result = await getter(source.source);

    if (!result) {
      return;
    }

    // Get the links
    const links = await linksSelector(result);

    // Discover the known sources from the links
    const linksPromises = links.map(link => this.discoverKnownSources(link, source));
    await Promise.all(linksPromises);

    return result;
  }

  /**
   * Executes the getter function from all the service providers
   *
   * @param getter: function that executes the call to get the result
   * @param linksSelector: function that gets the links from the retrieved result to ask for their sources
   * @returns the array of results retrieved
   */
  public async getGenericFromAllSources<R>(
    getter: (service: T) => Promise<R>,
    linksSelector: (object: R) => Promise<string[]>
  ): Promise<Array<R>> {
    const promises = this.getAllSourcesNames().map(async sourceName =>
      this.getGenericFromSource(sourceName, getter, linksSelector)
    );

    const results = await Promise.all(promises);
    return results.filter(result => !!result) as R[];
  }

  /**
   * Gets the object for the given hash from the given source
   *
   * @param hash the object hash
   * @param sourceName the source name from which to get the object from
   * @returns the object if found, otherwise undefined
   */
  public async getFromSource<O extends object>(
    hash: string,
    sourceName: string
  ): Promise<Hashed<O> | undefined> {
    const getter = (source: T) => source.get<O>(hash);

    // Get the object from source
    const object = await this.getGenericFromSource(sourceName, getter, (object: Hashed<O>) =>
      this.linksFromObject(object)
    );

    if (!object) {
      // Object retrieval succeeded but object was not found,
      // remove from the known sources
      await this.localKnownSources.removeKnownSource(hash, sourceName);
    }

    return object;
  }

  public async getArrayFromAllSources<O>(
    getter: (service: T) => Promise<Array<Hashed<O>>>
  ): Promise<Array<Hashed<O>>> {
    const linksSelector = async (array: Array<Hashed<O>>) => {
      const promises = array.map(object => this.linksFromObject<Hashed<O>>(object));
      const links = await Promise.all(promises);
      return Array.prototype.concat.apply([], links);
    };

    const objects = await this.getGenericFromAllSources(getter, linksSelector);

    return Array.prototype.concat.apply([], objects);
  }

  /**
   * Retrieves the object with the given hash
   *
   * @param hash the hash of the object to retrieve
   * @returns the object if found, otherwise undefined
   */
  public async get<O extends object>(hash: string): Promise<Hashed<O> | undefined> {
    // Get the known sources for the object from the local
    const knownSources = await this.localKnownSources.getKnownSources(hash);

    const tryGetFromSource = async (sourceName: string) => {
      const object = await this.getFromSource<O>(hash, sourceName);
      return object ? Promise.resolve(object) : Promise.reject();
    };

    let promises: Array<Promise<Hashed<O>>>;
    if (knownSources) {
      // Try to retrieve the object from any of the known sources
      promises = knownSources.map(tryGetFromSource);
    } else {
      // We had no known sources for the hash, try to get the object from all the sources
      const sourcesNames = this.getAllSourcesNames();

      promises = sourcesNames.map(async sourceName => {
        const object = await tryGetFromSource(sourceName);

        if (object) {
          // Luckily we found the object in one of the sources, store it in the known sources
          await this.localKnownSources.addKnownSources(hash, [sourceName]);
        }

        return object;
      });
    }

    try {
      // Get first resolved object
      const object: Hashed<O> = await this.raceToSuccess<Hashed<O>>(promises);
      return object;
    } catch (e) {
      this.logger.warn('All sources failed to get the hash', hash, ' with error ', e);

      // All sources failed, return undefined
      return undefined;
    }
  }

  /**
   * Execute the promises in parallel and return when the first promise resolves
   * Only reject if all promises rejected
   *
   * @param promises array of promises to execute
   * @returns the first resolved promise, or rejects if all promises rejected
   */
  private raceToSuccess<O>(promises: Array<Promise<O>>): Promise<O> {
    let numRejected = 0;
    let errors: Error[] = [];

    return new Promise((resolve, reject) =>
      promises.forEach(promise =>
        promise.then(resolve).catch(e => {
          errors.push(e);
          if (++numRejected === promises.length) reject(errors);
        })
      )
    );
  }
}
