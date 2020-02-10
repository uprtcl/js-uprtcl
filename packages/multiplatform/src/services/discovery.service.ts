import { multiInject, inject, injectable, id } from 'inversify';
import { ApolloClient, gql } from 'apollo-boost';

import { PatternRecognizer, Hashed, CortexModule, Pattern, HasLinks } from '@uprtcl/cortex';
import { Dictionary, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Source } from '../types/source';
import { KnownSourcesService } from './known-sources.service';
import { raceToSuccess, discoverKnownSources } from './discovery.utils';
import { MultiplatformBindings, SourcesBindings } from '../bindings';

@injectable()
export class DiscoveryService implements Source {
  protected logger = new Logger('DiscoveryService');

  services: Dictionary<Source>;

  source = '';
  hashRecipe = {};

  /**
   * @param recognizer the pattern recognizer to interact with the objects and their links
   * @param localKnownSources local service to store all known sources to be able to retrieve the object afterwards
   * @param serviceProviders array of all source service providers from which to get objects
   */
  constructor(
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer,
    @inject(MultiplatformBindings.LocalKnownSources)
    public localKnownSources: KnownSourcesService,
    @inject(ApolloClientModule.bindings.Client)
    public client: ApolloClient<any>,
    @multiInject(SourcesBindings.Source)
    sources: Array<Source>
  ) {
    // Build the sources dictionary from the resulting names
    this.services = sources.reduce(
      (services, service) => ({ ...services, [service.source]: service }),
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
  public getAllSourceNames(): string[] {
    return Object.keys(this.services);
  }

  /**
   * @returns gets all the services
   */
  public getAllSources(): Source[] {
    return Object.keys(this.services).map(upl => this.services[upl]);
  }

  /**
   * Gets the service with the given name
   *
   * @param source the source name that identifies the service provider
   * @returns the source identified with the given name
   */
  public getSource(source: string | undefined): Source {
    const sources: string[] = this.getAllSourceNames();

    if (!source) {
      if (sources.length === 1) {
        source = sources[0];
      } else
        throw new Error(
          'There is more than one registered service provider, you must provide the upl for the service provider you wish to interact with'
        );
    }

    const serviceProvider = this.services[source];
    if (!serviceProvider) throw new Error(`No service provider was found for name ${source}`);

    return serviceProvider;
  }

  /**
   * Gets the object for the given hash from the given source
   *
   * @param hash the object hash
   * @param source the source from which to get the object from
   * @returns the object if found, otherwise undefined
   */
  public async getFromSource<O extends object>(
    hash: string,
    sourceName: string | undefined
  ): Promise<Hashed<O> | undefined> {
    const source = this.getSource(sourceName);

    const object: Hashed<O> | undefined = await source.get(hash);

    if (!object) return undefined;

    // Get the links

    setTimeout(async () => {
      const result = await this.client.query({
        query: gql`
        {
          entity(id: "${hash}") {
            id
            _context {
              patterns {
                links {
                  id
                }
              }
            }
          }
        }
        `
      });
      const links = result.data.entity._context.patterns.links.map(l => l.id);

      // Discover the known sources from the links
      const linksPromises = links.map(link =>
        discoverKnownSources(this.localKnownSources)(link, source)
      );
      await Promise.all(linksPromises);
    });

    if (!object) {
      // Object retrieval succeeded but object was not found,
      // remove from the known sources
      await this.localKnownSources.removeKnownSource(hash, source.source);
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
    const sources = this.getAllSourceNames();

    if (sources.length === 1) {
      knownSources = sources;
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
      promises = this.getAllSourceNames().map(tryGetFromSource);
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

  /**
   * Adds the known sources of the links from the given object to the known sources service
   *
   * @param source
   * @param links
   */
  public async postEntityUpdate(source: Source, links: string[]): Promise<void> {
    const knownSourcesService = source.knownSources;
    if (!knownSourcesService) return;

    const promises = links.map(async link => {
      // We asume that we have stored the local known sources for the links from the object
      const knownSources = await this.localKnownSources.getKnownSources(link);

      // If the only known source is the name of the source itself, we don't need to tell the provider
      const sameSource =
        knownSources && knownSources.length === 1 && knownSources[0] === source.source;

      if (knownSources && !sameSource) {
        await knownSourcesService.addKnownSources(link, knownSources);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Adds the known sources of the links from the given object to the known sources service
   *
   * @param source
   * @param links
   */
  public async postEntityCreate<O extends Object>(
    source: Source,
    entity: Hashed<O>
  ): Promise<void> {
    const sourceName = source.source;

    await this.localKnownSources.addKnownSources(entity.id, [sourceName]);

    const patterns: Pattern[] = this.recognizer.recognize(entity);

    const hasLinks: HasLinks[] = (patterns.filter(
      p => ((p as unknown) as HasLinks).links
    ) as unknown) as HasLinks[];

    const promises = hasLinks.map(l => l.links(entity));

    const linksArray = await Promise.all(promises);

    const links = ([] as string[]).concat(...linksArray);

    await this.postEntityUpdate(source, links);
  }
}
