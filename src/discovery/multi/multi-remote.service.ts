import { Source } from '../sources/source';
import { LinkedProperties } from '../../patterns/linked.pattern';
import { MultiProviderService } from './multi-provider.service';

export class MultiRemoteService<T extends Source> extends MultiProviderService<T> {
  /**
   * Executes the given update function on the given source,
   * adding the known sources of the given object links to the source
   *
   * @param object the object to create
   * @param updater the update function to execute in the source
   * @param source the source to execute the update function in
   * @returns the result of the update function
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
      // Get the properties to get the object links from
      const properties = this.patternRegistry.from(object) as LinkedProperties;

      if (properties.hasOwnProperty('getLinks')) {
        const links = await properties.getLinks();

        const promises = links.map(async link => {
          // We asume that we have stored the local known sources for the links from the object
          const sources = await this.localKnownSources.getKnownSources(link);

          if (sources) {
            await provider.knownSources.addKnownSources(link, sources);
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
   * @param object the object to create
   * @param creator the creator function to execute
   * @param source the source to create the object in
   * @returns the hash of the newly created object
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
}
