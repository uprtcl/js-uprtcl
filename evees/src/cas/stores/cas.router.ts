import { Logger } from '../../utils/logger';
import { CASRemote } from '../interfaces/cas-remote';
import { CASStore, EntityGetResult } from '../interfaces/cas-store';
import { Entity, ObjectOnRemote } from '../interfaces/entity';

export class CASRouter implements CASStore {
  protected logger = new Logger('CASRouter');
  protected sourcesMap = new Map<string, CASRemote>();

  constructor(protected sources: Array<CASRemote>) {
    // Build the sources dictionary from the resulting names
    sources.forEach((source) => this.sourcesMap.set(source.casID, source));
  }

  storeEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    throw new Error('Method not implemented.');
  }
  hashEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    throw new Error('Method not implemented.');
  }
  storeEntity(object: ObjectOnRemote): Promise<string> {
    throw new Error('Method not implemented.');
  }
  hashEntity(object: ObjectOnRemote): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const entities = await this.tryGetFromSources(hashes);
    return {
      entities,
    };
  }
  flush(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getEntity(uref: string): Promise<Entity<any>> {
    throw new Error('Method not implemented.');
  }

  public async ready(): Promise<void> {
    await Promise.all(Array.from(this.sourcesMap.values()).map((source) => source.ready()));
  }

  public getAllCASIds(): string[] {
    return Array.from(this.sourcesMap.keys());
  }

  public getAllCASSources(): CASRemote[] {
    return Array.from(this.sourcesMap.values());
  }

  public getSource(casID: string): CASRemote | undefined {
    return this.sourcesMap.get(casID);
  }

  public async getFromSource(hashes: string[], casID: string): Promise<EntityGetResult> {
    const source = this.getSource(casID);
    if (!source) throw new Error(`Source ${casID} not found`);
    return source.getEntities(hashes);
  }

  /** Ask all registered sources for all the objects:
   *  - return all found objects when all objects found, or when all objects have been requested to all sources */
  private async tryGetFromSources(hashes: string[]): Promise<Entity<any>[]> {
    const requestedOn: string[] = [];
    const allObjects: Entity<any>[] = [];

    return new Promise((resolve) => {
      this.sources.map(async (source) => {
        try {
          const { entities: objects } = await this.getFromSource(hashes, source.casID);
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
}
