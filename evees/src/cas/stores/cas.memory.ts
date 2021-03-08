import lodash from 'lodash-es';

import { CASStore, EntityGetResult } from '../interfaces/cas-store';
import { Entity, EntityCreate } from '../interfaces/entity';

/** The CASOnMemory caches the created and read entities on memory.
 * When the flush() function is called, it stores all the cached created
 * entities on the base CASStore */
export class CASOnMemory implements CASStore {
  private newEntities = new Map<string, Entity>();
  private cachedEntities = new Map<string, Entity>();

  /** The base CASStore can be a better persisted CASStore in IndexedDB or the CAS router which will
   * connect to remote stores like IPFS or a web server.
   */
  constructor(protected base: CASStore) {}

  async cacheEntities(entities: Entity[]): Promise<void> {
    entities.forEach((entity) => this.cachedEntities.set(entity.id, entity));
  }

  async hashEntities(entities: EntityCreate[]): Promise<Entity[]> {
    return this.base.hashEntities(entities);
  }

  async diff() {
    return Array.from(this.newEntities.values());
  }

  async flush(): Promise<void> {
    const newEntities = Array.from(this.newEntities.values());

    /** store the objects on the base layer */
    await this.base.storeEntities(newEntities);

    /** add the entities to the cached entities */
    newEntities.forEach((entity) => this.cachedEntities.set(entity.id, entity));

    /** clear the newEntities buffer */
    this.newEntities.clear();
  }

  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const found: Entity[] = [];
    const notFound: string[] = [];

    /** Check the cache */
    hashes.forEach((hash) => {
      const entityCached = this.cachedEntities.get(hash);
      if (entityCached) {
        found.push(lodash.cloneDeep(entityCached));
      } else {
        /** Check the new entities buffer
         * TODO: better to add th new entities to the cachedEntities already, and only check that map.
         */
        const entityNew = this.newEntities.get(hash);
        if (entityNew) {
          found.push(lodash.cloneDeep(entityNew));
        } else {
          notFound.push(hash);
        }
      }
    });

    if (notFound.length === 0) {
      return {
        entities: found,
      };
    }

    // if not found, then ask the base store
    const result = await this.base.getEntities(notFound);
    const entities = found.concat(result.entities);

    // cache the read entities
    entities.forEach((entity) => {
      this.cachedEntities.set(entity.id, entity);
    });

    // and return them
    return { entities };
  }

  storeEntities(entities: EntityCreate[]): Promise<Entity[]> {
    return Promise.all(entities.map((e) => this.storeEntity(e)));
  }

  async storeEntity(entity: EntityCreate): Promise<Entity> {
    /** Store in the new entities buffer */
    const entityVer = await this.base.hashEntity(entity);
    entityVer.remote = entity.remote;

    this.newEntities.set(entityVer.id, entityVer);

    /** return the hash */
    return entityVer;
  }

  async getEntity<T = any>(uref: string): Promise<Entity> {
    const { entities } = await this.getEntities([uref]);
    return entities[0] as Entity<T>;
  }

  hashEntity<T = any>(entity: EntityCreate): Promise<Entity<T>> {
    return this.base.hashEntity(entity);
  }
}
