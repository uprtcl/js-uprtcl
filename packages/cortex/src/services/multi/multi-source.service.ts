import { multiInject, inject, injectable } from 'inversify';

import { Source, SourceProvider } from '../sources/source';
import { DiscoverableSource } from '../sources/discoverable.source';
import { KnownSourcesService } from '../known-sources/known-sources.service';
import { PatternRecognizer } from '../../patterns/recognizer/pattern.recognizer';
import { Hashed } from '../../patterns/properties/hashable';
import { PatternTypes, DiscoveryTypes } from '../../types';
import { MultiService } from './multi.service';

@injectable()
export class MultiSourceService<T extends SourceProvider = SourceProvider> extends MultiService<T>
  implements Source {
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
    super(patternRecognizer, localKnownSources, discoverableSources);
  }

  /**
   * Gets the object for the given hash from the given source
   *
   * @param hash the object hash
   * @param upl the source from which to get the object from
   * @returns the object if found, otherwise undefined
   */
  public async getFromSource<O extends object>(
    hash: string,
    upl: string | undefined
  ): Promise<Hashed<O> | undefined> {
    const getter = (source: T) => source.get<O>(hash);

    // Get the object from source
    const object = await this.getGenericFromService(upl, getter, (object: Hashed<O>) =>
      this.linksFromObject(object)
    );

    upl = this.getService(upl).service.uprtclProviderLocator;

    if (!object) {
      // Object retrieval succeeded but object was not found,
      // remove from the known sources
      await this.localKnownSources.removeKnownSource(hash, upl);
    }

    return object;
  }

  /**
   * Retrieves the object with the given hash
   *
   * @param hash the hash of the object to retrieve
   * @returns the object if found, otherwise undefined
   */
  public async get<O extends object>(hash: string): Promise<Hashed<O> | undefined> {
    let knownSources: string[] | undefined = undefined;

    // If there is only one source, use that to get the object
    const upls = this.getAllServicesUpl();

    if (upls.length === 1) {
      knownSources = upls;
    } else {
      // Get the known sources for the object from the local
      knownSources = await this.localKnownSources.getKnownSources(hash);
    }

    const tryGetFromSource = async (sourceName: string) => {
      const object = await this.getFromSource<O>(hash, sourceName);
      return object ? Promise.resolve(object) : Promise.reject();
    };

    let promises: Array<Promise<Hashed<O>>>;
    if (knownSources) {
      // Try to retrieve the object from any of the known sources
      promises = knownSources.map(tryGetFromSource);
    } else {
      // We had no known sources for the hash, try to get the object from any known sources service
      const knownSources: KnownSourcesService[] = Object.keys(this.services)
        .map(upl => this.services[upl].knownSources)
        .filter(s => s !== undefined) as KnownSourcesService[];

      promises = knownSources.map(async knownSource => {
        const upls = await knownSource.getKnownSources(hash);

        if (!upls) throw new Error('No known sources in this service');

        const requestsPromises = upls.map(async upl => {
          const object = await tryGetFromSource(upl);

          if (object) {
            // Luckily we found the object in one of the sources, store it in the known sources
            await this.localKnownSources.addKnownSources(hash, [upl]);
          }
          return object;
        });

        return this.raceToSuccess(requestsPromises);
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
