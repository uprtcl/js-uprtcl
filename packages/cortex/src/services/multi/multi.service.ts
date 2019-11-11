import { Dictionary } from 'lodash';

import { Logger } from '@uprtcl/micro-orchestrator';

import { HasLinks } from '../../patterns/properties/has-links';
import { ServiceProvider } from '../sources/service.provider';
import { Hashed } from '../../patterns/properties/hashable';
import { KnownSourcesService } from '../known-sources/known-sources.service';
import { DiscoverableService, DiscoverableSource } from '../sources/discoverable.source';
import { PatternRecognizer } from '../../patterns/recognizer/pattern.recognizer';
import { Ready } from '../sources/service.provider';
import { Pattern } from '../../patterns/pattern';

export class MultiService<T extends ServiceProvider> implements Ready {
  protected logger = new Logger('MultiProviderService');

  services: Dictionary<DiscoverableService<T>>;

  /**
   * @param patternRecognizer the pattern recognizer to interact with the objects and their links
   * @param localKnownSources local service to store all known sources to be able to retrieve the object afterwards
   * @param discoverableServices array of all discoverable services to which execute functions
   */
  constructor(
    protected patternRecognizer: PatternRecognizer,
    protected localKnownSources: KnownSourcesService,
    discoverableServices: Array<DiscoverableService<T>>
  ) {
    // Build the sources dictionary from the resulting names
    this.services = discoverableServices.reduce(
      (services, service) => ({ ...services, [service.service.uprtclProviderLocator]: service }),
      {}
    );
  }

  /**
   * @override
   */
  public async ready(): Promise<void> {
    const promises = Object.keys(this.services).map(serviceName =>
      this.services[serviceName].service.ready()
    );
    await Promise.all(promises);
  }

  /**
   * @returns gets the names of all the services
   */
  public getAllServicesNames(): string[] {
    return Object.keys(this.services);
  }

  /**
   * @returns gets all the services
   */
  public getAllServices(): T[] {
    return Object.keys(this.services).map(serviceName => this.services[serviceName].service);
  }

  /**
   * Gets the service with the given name
   *
   * @param serviceName the name of the source
   * @returns the source identified with the given name
   */
  public getService(serviceName: string): DiscoverableService<T> | undefined {
    const namedServiceName = Object.keys(this.services).find(name => name === serviceName);

    if (!namedServiceName) {
      return undefined;
    }

    return this.services[namedServiceName];
  }

  /** Getters */

  /**
   * Executes the getter function in all the services, and returns a flattened array containing the concatenated results
   *
   * @param getter the getter function to execute in all services
   * @returns a flattened array
   */
  public async getArrayFromAllServices<O>(
    getter: (service: T) => Promise<Array<Hashed<O>>>
  ): Promise<Array<Hashed<O>>> {
    const linksSelector = async (array: Array<Hashed<O>>) => {
      const promises = array.map(object => this.linksFromObject<Hashed<O>>(object));
      const links = await Promise.all(promises);
      return Array.prototype.concat.apply([], links);
    };

    const objects = await this.getGenericFromAllServices(getter, linksSelector);

    return Array.prototype.concat.apply([], objects);
  }

  /**
   * Executes the getter function from all the service providers
   *
   * @param getter: function that executes the call to get the result
   * @param linksSelector: function that gets the links from the retrieved result to ask for their sources
   * @returns the array of results retrieved
   */
  public async getGenericFromAllServices<R>(
    getter: (service: T) => Promise<R>,
    linksSelector: (object: R) => Promise<string[]>
  ): Promise<Array<R>> {
    const promises = this.getAllServicesNames().map(async sourceName =>
      this.getGenericFromService(sourceName, getter, linksSelector)
    );

    const results = await Promise.all(promises);
    return results.filter(result => !!result) as R[];
  }

  /**
   * Executes the getter function in the specified service
   *
   * @param serviceName name of the service to execute the getter function to
   * @param getter function to get the object from the specified service
   * @param linksSelector function to select links from the retrieved object
   * @returns the result of the getter function
   */
  public async getGenericFromService<R>(
    serviceName: string,
    getter: (service: T) => Promise<R | undefined>,
    linksSelector: (object: R) => Promise<string[]>
  ): Promise<R | undefined> {
    const service = this.getService(serviceName);

    if (!service) {
      this.logger.warn(`No source was found for name ${serviceName}`);
      return;
    }

    // Execute the getter
    const result = await getter(service.service);

    if (!result) {
      return;
    }

    // Get the links
    const links = await linksSelector(result);

    // Discover the known sources from the links
    const linksPromises = links.map(link => this.discoverKnownSources(link, service));
    await Promise.all(linksPromises);

    return result;
  }

  /**
   * Executes the given update function on the given service,
   * adding the known sources of the given object links to the service
   *
   * @param serviceName the name of the service to execute the update function in
   * @param updater the update function to execute in the source
   * @param object the object to create
   * @returns the result of the update function
   */
  public async updateIn<O extends object, S>(
    serviceName: string,
    updater: (service: T) => Promise<S>,
    object: O
  ): Promise<S> {
    // Execute the updater callback in the source
    const provider = this.services[serviceName];
    const result = await updater(provider.service);

    await this.addLinksToKnownSources(object, serviceName, provider.knownSources);

    return result;
  }

  /**
   * Creates the given object on the given service executing the given creator function,
   * adding the known sources of its links to the source
   *
   * @param serviceName the service name to create the object in
   * @param creator the creator function to execute
   * @param object the object to create
   * @returns the newly created object, along with its hash
   */
  public async createIn<O extends object>(
    serviceName: string,
    creator: (service: T) => Promise<Hashed<O>>
  ): Promise<Hashed<O>> {
    const provider = this.services[serviceName];
    const createdObject = await creator(provider.service);

    await this.addLinksToKnownSources(createdObject, serviceName, provider.knownSources);

    // We successfully created the object in the source, add to local known sources
    await this.localKnownSources.addKnownSources(createdObject.id, [serviceName]);

    return createdObject;
  }

  /** Private functions */

  /**
   * Retrieves the known sources for the given hash from the given source and stores them in the known sources service
   * @param hash the hash for which to discover the sources
   * @param service the service to ask for the known sources
   */
  protected async discoverKnownSources(
    hash: string,
    service: DiscoverableService<T>
  ): Promise<void> {
    if (!service.knownSources) return;

    const knownSourcesNames = await service.knownSources.getKnownSources(hash);

    if (knownSourcesNames) {
      await this.localKnownSources.addKnownSources(hash, knownSourcesNames);
    }
  }

  /**
   * Recognize the patterns from the object and get its links
   *
   * @param object the object
   * @returns the links implemented from the object
   */
  protected async linksFromObject<O extends object>(object: O): Promise<string[]> {
    // Recognize all pattern from object
    const pattern: Array<Pattern | HasLinks> = this.patternRecognizer.recognize(object);

    const promises = pattern.map(async pattern => {
      if ((pattern as HasLinks).getLinks) {
        return (pattern as HasLinks).getLinks(object);
      } else return [] as string[];
    });

    const links: string[][] = await Promise.all(promises);

    return ([] as string[]).concat(...links);
  }

  /**
   * Adds the known sources of the links from the given object to the known sources service
   *
   * @param object
   * @param serviceName
   * @param knownSourcesService
   */
  protected async addLinksToKnownSources<O extends object>(
    object: O,
    serviceName: string,
    knownSourcesService: KnownSourcesService | undefined
  ): Promise<void> {
    // Add known sources of the object's links to the provider's known sources
    if (knownSourcesService) {
      // Get the properties to get the object links from
      const pattern: HasLinks = this.patternRecognizer.recognizeMerge(object);

      if (pattern.getLinks) {
        const links = await pattern.getLinks(object);

        this.logger.info(
          'Updating known sources of the links ',
          links,
          ' from the object ',
          object,
          ' to the source ',
          serviceName
        );

        const promises = links.map(async link => {
          // We asume that we have stored the local known sources for the links from the object
          const knownSources = await this.localKnownSources.getKnownSources(link);

          // If the only known source is the name of the source itself, we don't need to tell the provider
          const sameSource =
            knownSources && knownSources.length === 1 && knownSources[0] === serviceName;

          if (knownSources && !sameSource) {
            await knownSourcesService.addKnownSources(link, knownSources);
          }
        });

        await Promise.all(promises);
      }
    }
  }
}
