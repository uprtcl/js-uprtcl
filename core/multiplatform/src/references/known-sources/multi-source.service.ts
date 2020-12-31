import { Pattern, HasLinks, Entity } from '@uprtcl/cortex';
import { Logger } from '@uprtcl/micro-orchestrator';

import { CASSource } from '../../types/cas-source';
import { KnownSourcesService } from './known-sources.service';
import { raceToSuccess, discoverKnownSources } from './discovery.utils';
import { KnownSourcesSource } from './known-sources.source';

@injectable()
export class MultiSourceService {
  protected logger = new Logger('MultiSourceService');
  protected sourcesMap = new Map<string, CASSource>();

  /**
   * @param localKnownSources local service to store all known sources to be able to retrieve the object afterwards
   * @param sources array of all stores from which to get objects
   */
  constructor(public localKnownSources: KnownSourcesService, sources: Array<CASSource>) {
    // Build the sources dictionary from the resulting names
    sources.forEach((source) => this.sourcesMap.set(source.casID, source));
  }

  public async ready(): Promise<void> {
    await Promise.all(Array.from(this.sourcesMap.values()).map((source) => source.ready()));
  }

  /**
   * @returns gets the casID of all the sources
   */
  public getAllCASIds(): string[] {
    return Array.from(this.sourcesMap.keys());
  }

  /**
   * @returns gets all the sources
   */
  public getAllCASSources(): CASSource[] {
    return Array.from(this.sourcesMap.values());
  }

  /**
   * Gets the service with the given name
   *
   * @param casID the source name that identifies the service provider
   * @returns the source identified with the given name
   */
  public getSource(casID: string): CASSource | undefined {
    return this.sourcesMap.get(casID);
  }

  /**
   * Gets the object for the given hash from the given source
   *
   * @param hash the object hash
   * @param source the source from which to get the object from
   * @returns the object if found, otherwise undefined
   */
  public async getFromSource(hashes: string[], casID: string): Promise<Entity<any>[]> {
    const source = this.getSource(casID);
    if (!source) throw new Error(`Source ${casID} not found`);
    return source.get(hashes);
  }

  private async tryGetFromSources(hashes: string): Promise<Entity<O> | undefined> {
    const tryGetFromSource = async (sourceName: string) => {
      const object = await this.getFromSource(hashes, sourceName);
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
  public async get(hash: string): Promise<Entity<O> | undefined> {
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
        this.logger.warn('All sources failed to get the hash', {
          hash,
          allCids,
        });
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
