import { LinkedPattern } from '../../patterns/patterns/linked.pattern';
import { MultiSourceService } from './multi-source.service';
import { NamedSource } from '../sources/named.source';

export class MultiProviderService<T extends NamedSource> extends MultiSourceService<T> {

  /**
   * Executes the given update function on the given source,
   * adding the known sources of the given object links to the source
   *
   * @param sourceName the name of the source to execute the update function in
   * @param updater the update function to execute in the source
   * @param object the object to create
   * @returns the result of the update function
   */
  public async updateIn<O extends object, S>(
    sourceName: string,
    updater: (service: T) => Promise<S>,
    object: O
  ): Promise<S> {

    // Execute the updater callback in the source
    const discoverableSource = this.sources[sourceName];
    const result = await updater(discoverableSource.source);

    // Add known sources of the object's links to the provider's known sources
    if (discoverableSource.knownSources) {
      // Get the properties to get the object links from
      const pattern: LinkedPattern<O> = this.patternRecognizer.recognizeMerge(object);

      if (pattern.hasOwnProperty('getLinks')) {
        const links = await pattern.getLinks(object);

        const promises = links.map(async link => {
          // We asume that we have stored the local known sources for the links from the object
          const knownSources = await this.localKnownSources.getKnownSources(link);

          // If the only known source is the name of the source itself, we don't need to tell the provider
          const sameSource =
            knownSources && knownSources.length === 1 && knownSources[0] === sourceName;

          if (knownSources && !sameSource) {
            await discoverableSource.knownSources.addKnownSources(link, knownSources);
          }
        });

        await Promise.all(promises);
      }
    }

    return result;
  }

  /**
   * Creates the given object on the given source executing the given creator function,
   * adding the known sources of its links to the source
   *
   * @param sourceName the source name to create the object in
   * @param creator the creator function to execute
   * @param object the object to create
   * @returns the hash of the newly created object
   */
  public async createIn<O extends object>(
    sourceName: string,
    creator: (service: T) => Promise<string>,
    object: O
  ): Promise<string> {
    const hash = await this.updateIn(sourceName, creator, object);

    // We successfully created the object in the source, add to local known sources
    await this.localKnownSources.addKnownSources(hash, [sourceName]);

    return hash;
  }
}
