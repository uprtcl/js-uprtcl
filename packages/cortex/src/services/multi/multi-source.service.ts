import { multiInject, inject, injectable } from 'inversify';
import { Dictionary } from 'lodash';

import { Logger } from '@uprtcl/micro-orchestrator';

import { Source } from '../sources/source';
import { HasLinks } from '../../patterns/properties/has-links';
import { DiscoverableSource } from '../sources/discoverable.source';
import { KnownSourcesService } from '../known-sources/known-sources.service';
import { PatternRecognizer } from '../../patterns/recognizer/pattern.recognizer';
import { Hashed } from '../../patterns/properties/hashable';
import { NamedSource } from '../sources/named.source';
import { PatternTypes, DiscoveryTypes } from '../../types';
import { MultiService } from './multi.service';

@injectable()
export class MultiSourceService<T extends NamedSource = NamedSource> extends MultiService<T>
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
   * @param sourceName the source name from which to get the object from
   * @returns the object if found, otherwise undefined
   */
  public async getFromSource<O extends object>(
    hash: string,
    sourceName: string
  ): Promise<Hashed<O> | undefined> {
    const getter = (source: T) => source.get<O>(hash);

    // Get the object from source
    const object = await this.getGenericFromService(sourceName, getter, (object: Hashed<O>) =>
      this.linksFromObject(object)
    );

    if (!object) {
      // Object retrieval succeeded but object was not found,
      // remove from the known sources
      await this.localKnownSources.removeKnownSource(hash, sourceName);
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
      const sourcesNames = this.getAllServicesNames();

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