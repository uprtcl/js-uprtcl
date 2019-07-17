import { LinkedPattern } from '../../patterns/linked.pattern';
import { Source } from '../sources/source';
import { MultiSourceService } from './multi-source.service';

export class MultiProviderService<T extends Source> extends MultiSourceService<T> {
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
    const source = this.sources[sourceName];
    const result = await updater(source.source);

    // Add known sources of the object's links to the provider's known sources
    if (source.knownSources) {
      // Get the properties to get the object links from
      const pattern = this.patternRegistry.from(object) as LinkedPattern<O>;

      if (pattern.hasOwnProperty('getLinks')) {
        const links = await pattern.getLinks(object);

        const promises = links.map(async link => {
          // We asume that we have stored the local known sources for the links from the object
          const knownSources = await this.localKnownSources.getKnownSources(link);

          // If the only known source is the name of the source itself, we don't need to tell the provider
          const sameSource =
            knownSources && knownSources.length === 1 && knownSources[0] === sourceName;

          if (knownSources && !sameSource) {
            await source.knownSources.addKnownSources(link, knownSources);
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
   * @param source the source to create the object in
   * @param creator the creator function to execute
   * @param object the object to create
   * @returns the hash of the newly created object
   */
  public async createIn<O extends object>(
    source: string,
    creator: (service: T) => Promise<string>,
    object: O
  ): Promise<string> {
    const hash = await this.updateIn(source, creator, object);

    // We successfully created the object in the source, add to local known sources
    await this.localKnownSources.addKnownSources(hash, [source]);

    return hash;
  }
}
