import { Logger, Dictionary } from '@uprtcl/micro-orchestrator';

import { HasLinks, Hashed, PatternRecognizer } from '@uprtcl/cortex';

import { Authority } from '../types/authority';
import { KnownSourcesService } from './known-sources.service';
import { Ready } from '../types/ready';
import { linksFromObject, discoverKnownSources } from './discovery.utils';

export class MultiService<T extends Authority> implements Ready {
  protected logger = new Logger('MultiProviderService');

  services: Dictionary<T>;

  /**
   * @param recognizer the pattern recognizer to interact with the objects and their links
   * @param localKnownSources local service to store all known sources to be able to retrieve the object afterwards
   * @param serviceProviders array of all service providers to which execute functions
   */
  constructor(
    protected recognizer: PatternRecognizer,
    public localKnownSources: KnownSourcesService,
    serviceProviders: Array<T>
  ) {
    // Build the sources dictionary from the resulting names
    this.services = serviceProviders.reduce(
      (services, service) => ({ ...services, [service.authority]: service }),
      {}
    );
  }

  /**
   * @override
   */
  public async ready(): Promise<void> {
    const promises = Object.keys(this.services).map(serviceName =>
      this.services[serviceName].ready()
    );
    await Promise.all(promises);
  }

  /**
   * @returns gets the upl of all the services
   */
  public getAllServicesUpl(): string[] {
    return Object.keys(this.services);
  }

  /**
   * @returns gets all the services
   */
  public getAllServices(): T[] {
    return Object.keys(this.services).map(upl => this.services[upl]);
  }

  /**
   * Executes the getter function in the specified service
   *
   * @param upl of the service to execute the getter function to
   * @param getter function to get the object from the specified service
   * @param linksSelector function to select links from the retrieved object
   * @returns the result of the getter function
   */
  public async getGenericFromService<R>(
    upl: string | undefined,
    getter: (service: T) => Promise<R | undefined>,
    linksSelector: (object: R) => Promise<string[]>
  ): Promise<R | undefined> {
    const source = this.getService(upl);

    // Execute the getter
    const result = await getter(source);

    if (!result) return undefined;

    // Get the links
    const links = await linksSelector(result);

    // Discover the known sources from the links
    const linksPromises = links.map(link =>
      discoverKnownSources(this.localKnownSources)(link, source)
    );
    await Promise.all(linksPromises);

    return result;
  }
  /**
   * Gets the service with the given name
   *
   * @param upl the UprtclProviderLocator that identifies the service provider
   * @returns the source identified with the given name
   */
  public getService(upl: string | undefined): T {
    const upls: string[] = this.getAllServicesUpl();

    if (!upl) {
      if (upls.length === 1) {
        upl = upls[0];
      } else
        throw new Error(
          'There is more than one registered service provider, you must provide the upl for the service provider you wish to interact with'
        );
    }

    const serviceProvider = this.services[upl];
    if (!serviceProvider) throw new Error(`No service provider was found for name ${upl}`);

    return serviceProvider;
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
      const promises = array.map(object => linksFromObject(this.recognizer)(object));
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
    const promises = this.getAllServicesUpl().map(async upl =>
      this.getGenericFromService(upl, getter, linksSelector)
    );

    const results = await Promise.all(promises);
    return results.filter(result => !!result) as R[];
  }

  /**
   * Executes the given update function on the given service,
   * adding the known sources of the given object links to the service
   *
   * @param upl of the service to execute the update function in
   * @param updater the update function to execute in the source
   * @param object the object to create
   * @returns the result of the update function
   */
  public async updateIn<O extends object, S>(
    upl: string | undefined,
    updater: (service: T) => Promise<S>,
    object: O
  ): Promise<S> {
    // Execute the updater callback in the source
    const provider = this.getService(upl);
    const result = await updater(provider);

    if (provider.knownSources) {
      await this.addLinksToKnownSources(object, upl, provider.knownSources);
    }

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
    upl: string | undefined,
    creator: (service: T) => Promise<Hashed<O>>
  ): Promise<Hashed<O>> {
    const provider = this.getService(upl);
    upl = provider.uprtclProviderLocator;

    const createdObject = await creator(provider);

    if (provider.knownSources) {
      await this.addLinksToKnownSources(createdObject, upl, provider.knownSources);
    }

    // We successfully created the object in the source, add to local known sources
    await this.localKnownSources.addKnownSources(createdObject.id, [upl]);

    return createdObject;
  }

  /** Private functions */

  /**
   * Adds the known sources of the links from the given object to the known sources service
   *
   * @param object
   * @param upl
   * @param knownSourcesService
   */
  protected async addLinksToKnownSources<O extends object>(
    object: O,
    upl: string | undefined,
    knownSourcesService: KnownSourcesService
  ): Promise<void> {
    // Add known sources of the object's links to the provider's known sources
    // Get the properties to get the object links from
    const getLinks: HasLinks<O>[] = this.recognizer
      .recognize(object)
      .filter(prop => !!(prop as HasLinks<O>).links);

    const linksPromises = getLinks.map(get => get.links(object));

    const allLinks = await Promise.all(linksPromises);

    const links = ([] as string[]).concat(...allLinks);

    this.logger.info(
      'Updating known sources of the links ',
      links,
      ' from the object ',
      object,
      ' to the service provider ',
      upl
    );

    const promises = links.map(async link => {
      // We asume that we have stored the local known sources for the links from the object
      const knownSources = await this.localKnownSources.getKnownSources(link);

      // If the only known source is the name of the source itself, we don't need to tell the provider
      const sameSource = knownSources && knownSources.length === 1 && knownSources[0] === upl;

      if (knownSources && !sameSource) {
        await knownSourcesService.addKnownSources(link, knownSources);
      }
    });

    await Promise.all(promises);
  }
}
