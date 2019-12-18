import { multiInject, inject, injectable } from 'inversify';

import { Source, SourceProvider } from '../sources/source';
import { KnownSourcesService } from '../known-sources/known-sources.service';
import { PatternRecognizer } from '../../patterns/recognizer/pattern.recognizer';
import { Hashed } from '../../patterns/properties/hashable';
import { CortexTypes, DiscoveryTypes } from '../../types';
import { MultiService } from './multi.service';
import { linksFromObject, raceToSuccess } from '../discovery.utils';

@injectable()
export class MultiSourceService<T extends SourceProvider = SourceProvider> extends MultiService<T>
  implements Source {
  /**
   * @param recognizer the pattern recognizer to interact with the objects and their links
   * @param localKnownSources local service to store all known sources to be able to retrieve the object afterwards
   * @param serviceProviders array of all source service providers from which to get objects
   */
  constructor(
    @inject(CortexTypes.Recognizer) protected recognizer: PatternRecognizer,
    @inject(DiscoveryTypes.LocalKnownSources)
    public localKnownSources: KnownSourcesService,
    @multiInject(DiscoveryTypes.Source)
    sourceProviders: Array<T>
  ) {
    super(recognizer, localKnownSources, sourceProviders);
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
      linksFromObject(this.recognizer)(object)
    );

    upl = this.getService(upl).uprtclProviderLocator;

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
      // Get the known sources for the object from the local known sources service
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

        return raceToSuccess(requestsPromises);
      });
    }

    try {
      // Get first resolved object
      const object: Hashed<O> = await raceToSuccess<Hashed<O>>(promises);
      return object;
    } catch (e) {
      this.logger.warn('All sources failed to get the hash', hash, ' with error ', e);

      // All sources failed, return undefined
      return undefined;
    }
  }

}
