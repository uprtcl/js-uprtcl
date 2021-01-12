import { injectable } from 'src/evees/merge/node_modules/inversify';

import { Entity } from 'src/evees/elements/node_modules/src/evees/patterns/node_modules/src/evees/merge/node_modules/src/evees/behaviours/node_modules/@uprtcl/cortex';
import { Logger } from 'src/evees/elements/node_modules/@uprtcl/evees';

import { CASSource } from '../types/cas-source';
import { KnownSourcesService } from './known-sources.service';

@injectable()
export class MultiSourceService {
  protected logger = new Logger('MultiSourceService');
  protected sourcesMap = new Map<string, CASSource>();

  /**
   * @param localKnownSources local service to store all known sources to be able to retrieve the object afterwards
   * @param sources array of all stores from which to get objects
   */
  constructor(public localKnownSources: KnownSourcesService, protected sources: Array<CASSource>) {
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

  /** Ask all registered sources for all the objects:
   *  - return all found objects when all objects found, or when all objects have been requested to all sources */
  private async tryGetFromSources(hashes: string[]): Promise<Entity<any> | undefined> {
    const requestedOn: string[] = [];
    const allObjects: Entity<any>[] = [];

    return new Promise((resolve) => {
      this.sources.map(async (source: CASSource) => {
        try {
          const objects = await this.getFromSource(hashes, source.casID);
          requestedOn.push(source.casID);

          // append to all found objects (prevent duplicates)
          allObjects.push(
            ...objects.filter((o) => allObjects.findIndex((all) => all.id === o.id) === -1)
          );

          // if found as many objects as hashes requested, resove (dont wait for other sources to return)
          if (allObjects.length === hashes.length) {
            resolve(allObjects);
          }
        } catch (e) {
          // a failure to get objects from a source is consider as objects not present
          requestedOn.push(source.casID);
        }

        // resolve once all soruces have been requested
        if (requestedOn.length === this.sources.length) {
          resolve(allObjects);
        }
      });
    });
  }

  /**
   * Retrieves the objects with the given hashes
   *
   * @param hashes the hashes of the objects to retrieve
   * @returns the objects found (might be some or none of the hashes provided)
   */
  public async get(hashes: string[]): Promise<Entity<any>[]> {
    return this.tryGetFromSources(hashes);
  }
}
