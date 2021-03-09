import { Logger } from '../../utils/logger';
import { CASRemote } from '../interfaces/cas-remote';
import { CASStore, EntityGetResult } from '../interfaces/cas-store';
import { Entity, ObjectOn } from '../interfaces/entity';

export class CASRouter implements CASStore {
  protected logger = new Logger('CASRouter');

  storesMap: Map<string, CASRemote>;

  constructor(stores: CASRemote[], protected remoteToSourcesMap: Map<string, string>) {
    this.storesMap = new Map();
    stores.forEach((store) => {
      this.storesMap.set(store.casID, store);
    });
  }

  cacheEntities(entities: Entity<any>[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const entities = await this.tryGetFromSources(hashes);
    return {
      entities,
    };
  }

  async flush(): Promise<void> {
    throw new Error('Router dont cache');
  }

  async getEntity(uref: string): Promise<Entity<any>> {
    const { entities } = await this.getEntities([uref]);
    return entities[0];
  }

  async storeEntities(objects: ObjectOn[]): Promise<Entity<any>[]> {
    const objectsPerStore = new Map<string, object[]>();

    objects.forEach((objectOn) => {
      const casID = this.getObjectCasID(objectOn);
      let current = objectsPerStore.get(casID);
      if (!current) {
        current = [];
      }
      current.push(objectOn.object);
      objectsPerStore.set(casID, current);
    });

    const entitiesPerRemote = await Promise.all(
      Array.from(objectsPerStore.entries()).map(async ([casId, objects]) => {
        const store = this.getStore(casId);
        return store.storeObjects(objects);
      })
    );

    return Array.prototype.concat([], entitiesPerRemote);
  }

  hashEntities(objects: ObjectOn[]): Promise<Entity<any>[]> {
    return Promise.all(objects.map(async (o) => this.hashEntity(o)));
  }

  async storeEntity(object: ObjectOn): Promise<string> {
    const entities = await this.storeEntities([object]);
    return entities[0].id;
  }

  hashEntity<T = any>(object: ObjectOn): Promise<Entity<T>> {
    return this.hashOnSource(object);
  }

  getObjectCasID(objectOn: ObjectOn) {
    let casID = objectOn.casID
      ? objectOn.casID
      : this.remoteToSourcesMap.get(objectOn.remote as string);
    if (!casID) {
      casID = Array.from(this.storesMap.values())[0].casID;
    }
    return casID;
  }

  getObjectStore(object: ObjectOn): CASRemote {
    return this.getStore(this.getObjectCasID(object));
  }

  getStore(casID: string): CASRemote {
    const store = this.storesMap.get(casID);
    if (!store) throw new Error('Store not found');
    return store;
  }

  public async hashOnSource(object: ObjectOn) {
    const store = this.getObjectStore(object);
    return store.hashEntity(object);
  }

  public async ready(): Promise<void> {
    await Promise.all(Array.from(this.storesMap.values()).map((source) => source.ready()));
  }

  public getAllCASIds(): string[] {
    return Array.from(this.storesMap.keys());
  }

  public getAllCASSources(): CASRemote[] {
    return Array.from(this.storesMap.values());
  }

  public getSource(casID: string): CASRemote {
    const source = this.storesMap.get(casID);
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
      Array.from(this.storesMap.keys()).map(async (casID) => {
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
        if (requestedOn.length === this.storesMap.size) {
          resolve(Array.from(allObjects.values()));
        }
      });
    });
  }
}
