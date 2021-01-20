import { Logger } from '../../utils/logger';
import { CASRemote } from '../interfaces/cas-remote';
import { CASStore, EntityGetResult } from '../interfaces/cas-store';
import { Entity, ObjectOnRemote } from '../interfaces/entity';

export class CASRouter implements CASStore {
  protected logger = new Logger('CASRouter');

  constructor(
    protected sources: Map<string, CASRemote>,
    protected remoteToSourcesMap: Map<string, string>
  ) {}

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
    await Promise.all(Array.from(this.sources.values()).map((source) => source.ready()));
  }

  public getAllCASIds(): string[] {
    return Array.from(this.sources.keys());
  }

  public getAllCASSources(): CASRemote[] {
    return Array.from(this.sources.values());
  }

  public getSource(remoteId: string): CASRemote {
    const casID = this.remoteToSourcesMap.get(remoteId);
    if (!casID) throw new Error(`Not CASId registered for remote ${remoteId}`);
    const source = this.sources.get(casID);
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
      Array.from(this.sources.keys()).map(async (casID) => {
        try {
          const { entities } = await this.getFromSource(hashes, casID);
          requestedOn.push(casID);

          // append to all found objects (prevent duplicates)
          entities.map((e) => allObjects.set(e.id, e));

          // if found as many objects as hashes requested, resove (dont wait for other sources to return)
          if (entities.length === hashes.length) {
            resolve(Array.from(allObjects.values()));
          }
        } catch (e) {
          // a failure to get objects from a source is consider as objects not present
          requestedOn.push(casID);
        }

        // resolve once all sources have been requested
        if (requestedOn.length === this.sources.size) {
          resolve(Array.from(allObjects.values()));
        }
      });
    });
  }
}
