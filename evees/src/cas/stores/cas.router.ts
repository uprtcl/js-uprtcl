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

  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const entities = await this.tryGetFromSources(hashes);
    return {
      entities,
    };
  }

  async flush(): Promise<void> {}
  async getEntity(uref: string): Promise<Entity<any>> {
    const { entities } = await this.getEntities([uref]);
    return entities[0];
  }

  storeEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    return Promise.all(
      objects.map(async (o) => {
        const hash = await this.storeEntity(o);
        return { id: hash, object: o };
      })
    );
  }
  hashEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    return Promise.all(
      objects.map(async (o) => {
        const hash = await this.hashEntity(o);
        return { id: hash, object: o };
      })
    );
  }

  storeEntity(object: ObjectOnRemote): Promise<string> {
    return this.storeOnSource(object);
  }
  hashEntity(object: ObjectOnRemote): Promise<string> {
    return this.hashOnSource(object);
  }

  public async storeOnSource(object: ObjectOnRemote) {
    const source = this.getSource(object.remote);
    return source.storeEntity(object);
  }

  public async hashOnSource(object: ObjectOnRemote) {
    const source = this.getSource(object.remote);
    return source.hashEntity(object);
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

  public getSource(casID: string): CASRemote {
    const source = this.sourcesMap.get(casID);
    if (!source) throw new Error(`Source not found for casID ${casID}`);
    return source;
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
    const allObjects: Map<string, Entity<any>> = new Map();

    return new Promise((resolve) => {
      this.sources.map(async (source) => {
        try {
          const { entities } = await this.getFromSource(hashes, source.casID);
          requestedOn.push(source.casID);

          // append to all found objects (prevent duplicates)
          entities.map((e) => allObjects.set(e.id, e));

          // if found as many objects as hashes requested, resove (dont wait for other sources to return)
          if (entities.length === hashes.length) {
            resolve(Array.from(allObjects.values()));
          }
        } catch (e) {
          // a failure to get objects from a source is consider as objects not present
          requestedOn.push(source.casID);
        }

        // resolve once all sources have been requested
        if (requestedOn.length === this.sources.length) {
          resolve(Array.from(allObjects.values()));
        }
      });
    });
  }
}
