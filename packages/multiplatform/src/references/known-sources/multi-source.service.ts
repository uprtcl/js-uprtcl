import { multiInject, inject, injectable, optional } from 'inversify';
import { ApolloClient, gql } from 'apollo-boost';

import { PatternRecognizer, CortexModule, Pattern, HasLinks, Entity } from '@uprtcl/cortex';
import { Dictionary, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { CASSource } from '../../types/cas-source';
import { KnownSourcesService } from './known-sources.service';
import { raceToSuccess, discoverKnownSources } from './discovery.utils';
import { DiscoveryBindings, CASBindings } from '../../bindings';
import { KnownSourcesSource } from './known-sources.source';

@injectable()
export class MultiSourceService {
  protected logger = new Logger('MultiSourceService');

  services: Dictionary<CASSource>;

  /**
   * @param recognizer the pattern recognizer to interact with the objects and their links
   * @param localKnownSources local service to store all known sources to be able to retrieve the object afterwards
   * @param serviceProviders array of all source service providers from which to get objects
   */
  constructor(
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer,
    @inject(DiscoveryBindings.LocalKnownSources)
    public localKnownSources: KnownSourcesService,
    @inject(ApolloClientModule.bindings.Client)
    public client: ApolloClient<any>,
    @multiInject(CASBindings.CASSource)
    sources: Array<CASSource>,
    @multiInject(DiscoveryBindings.DefaultSource)
    @optional()
    protected defaultSources: Array<string> | undefined
  ) {
    // Build the sources dictionary from the resulting names
    this.services = sources.reduce(
      (services, service) => ({ ...services, [service.casID]: service }),
      {}
    );
  }

  /**
   * @override
   */
  public async ready(): Promise<void> {
    const promises = Object.keys(this.services).map((serviceName) =>
      this.services[serviceName].ready()
    );
    await Promise.all(promises);
  }

  /**
   * @returns gets the casID of all the sources
   */
  public getAllCASIds(): string[] {
    return Object.keys(this.services);
  }

  /**
   * @returns gets all the services
   */
  public getAllCASSources(): CASSource[] {
    return Object.keys(this.services).map((casID) => this.services[casID]);
  }

  /**
   * Gets the service with the given name
   *
   * @param source the source name that identifies the service provider
   * @returns the source identified with the given name
   */
  public getSource(casID: string | undefined): CASSource {
    const sources: string[] = this.getAllCASIds();

    if (!casID) {
      if (sources.length === 1) {
        casID = sources[0];
      } else
        throw new Error(
          'There is more than one registered service provider, you must provide the casID for the service provider you wish to interact with'
        );
    }

    const serviceProvider = this.services[casID];
    if (!serviceProvider) throw new Error(`No service provider was found for casID ${casID}`);

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
    casID: string | undefined
  ): Promise<Entity<O> | undefined> {
    const source = this.getSource(casID);

    const object: O | undefined = (await source.get(hash)) as O;

    if (!object) return undefined;

    if ((source as KnownSourcesSource).knownSources) {
      // Get the links

      setTimeout(async () => {
        const result = await this.client.query({
          query: gql`
        {
          entity(ref: "${hash}") {
            id
            _context {
              patterns {
                links {
                  id
                  __typename
                }
              }
            }
          }
        }
        `,
        });

        const linksResult = result.data.entity._context.patterns.links;
        if (linksResult) {
          // Discover the known sources from the links
          const linksPromises = linksResult.map((link) =>
            discoverKnownSources(this.localKnownSources)(
              link.id,
              link.__typename,
              source as KnownSourcesSource
            )
          );
          await Promise.all(linksPromises);
        }
      });
    }

    if (!object) {
      // Object retrieval succeeded but object was not found,
      // remove from the known sources
      await this.localKnownSources.removeKnownSource(hash, source.casID);
    }

    return {
      id: hash,
      object,
      casID,
    };
  }

  private async tryGetFromSources<O extends object>(
    hash: string,
    sources: string[]
  ): Promise<Entity<O> | undefined> {
    const tryGetFromSource = async (sourceName: string) => {
      const object = await this.getFromSource<O>(hash, sourceName);
      return object ? Promise.resolve(object) : Promise.reject();
    };

    const promises = sources.map(tryGetFromSource);

    try {
      // Get first resolved object
      return await raceToSuccess<Entity<O>>(promises);
    } catch (e) {
      // All sources failed, return undefined
      return undefined;
    }
  }

  /**
   * Retrieves the object with the given hash
   *
   * @param hash the hash of the object to retrieve
   * @returns the object if found, otherwise undefined
   */
  public async get<O extends object>(hash: string): Promise<Entity<O> | undefined> {
    let knownSources: string[] | undefined = undefined;

    // If there is only one source, use that to get the object
    const sources = this.getAllCASIds();

    if (sources.length === 1) {
      knownSources = sources;
    } else {
      // Get the known sources for the object from the local known sources service
      knownSources = await this.localKnownSources.getKnownSources(hash);
    }

    if (knownSources) {
      return this.tryGetFromSources(hash, knownSources);
    } else {
      const allCids = this.getAllCASIds();
      let remainingCids = allCids;
      if (this.defaultSources) {
        const defaultSources = this.defaultSources;
        const object = await this.tryGetFromSources<O>(hash, defaultSources);

        if (object) return object;
        remainingCids = remainingCids.filter((casID) => !defaultSources.includes(casID));
      }

      const finalObject = await this.tryGetFromSources<O>(hash, remainingCids);
      if (!finalObject) {
        this.logger.warn('All sources failed to get the hash', { hash, allCids });
      }

      return finalObject;
    }
  }

  /**
   * Adds the known sources of the links from the given object to the known sources service
   *
   * @param source
   * @param links
   */
  public async postEntityUpdate(source: KnownSourcesSource, links: string[]): Promise<void> {
    const knownSourcesService = source.knownSources;
    if (!knownSourcesService) return;

    const promises = links.map(async (link) => {
      // We asume that we have stored the local known sources for the links from the object
      const knownSources = await this.localKnownSources.getKnownSources(link);

      // If the only known source is the name of the source itself, we don't need to tell the provider
      const sameSource =
        knownSources && knownSources.length === 1 && knownSources[0] === source.casID;

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
  public async postEntityCreate<O extends Object>(entity: Entity<O>): Promise<void> {
    if (!entity.casID) {
      throw new Error('casID for the entity is required and none was provided');
    }

    const patterns: Pattern<any>[] = this.recognizer.recognize(entity);

    const hasLinks: HasLinks[] = (patterns.filter(
      (p) => ((p as unknown) as HasLinks).links
    ) as unknown) as HasLinks[];

    const promises = hasLinks.map((l) => l.links(entity));

    const linksArray = await Promise.all(promises);

    const links = ([] as string[]).concat(...linksArray);

    const source = this.getSource(entity.casID);

    if ((source as KnownSourcesSource).knownSources) {
      await this.postEntityUpdate(source as KnownSourcesSource, links);
    }
  }
}
