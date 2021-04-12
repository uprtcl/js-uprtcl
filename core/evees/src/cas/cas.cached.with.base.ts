import lodash from 'lodash';
import { CASCache } from './cas.cache';

import { CASStore, EntityGetResult } from './interfaces/cas-store';
import { Entity, EntityCreate } from './interfaces/entity';
import { validateEntities } from './utils/cid-hash';

export class CASCachedWithBase implements CASStore {
  constructor(
    protected cache: CASCache,
    protected base?: CASStore,
    protected cacheEnabled: boolean = true
  ) {}

  async cacheEntities(entities: Entity[]): Promise<void> {
    entities.forEach((entity) => this.cache.cacheEntity(entity));
  }

  async hashEntities(entities: EntityCreate[]): Promise<Entity[]> {
    if (!this.base) {
      throw new Error('Based store not defined');
    }
    return this.base.hashEntities(entities);
  }

  async diff() {
    return this.cache.diff();
  }

  async flush(): Promise<void> {
    if (!this.base) {
      throw new Error('Based store not defined');
    }

    const newEntities = await this.cache.diff();

    /** store the objects on the base layer */
    await this.base.storeEntities(newEntities);

    /** add the entities to the cached entities */
    newEntities.forEach((entity) => this.cache.cacheEntity(entity));

    /** clear the newEntities buffer */
    await this.cache.clear();
  }

  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const found: Entity[] = [];
    const notFound: string[] = [];

    /** Check the cache */
    await Promise.all(
      hashes.map(async (hash) => {
        const entityCached = await this.cache.getCachedEntity(hash);
        if (entityCached) {
          found.push(lodash.cloneDeep(entityCached));
        } else {
          /** Check the new entities buffer
           * TODO: better to add th new entities to the cachedEntities already, and only check that map.
           */
          const entityNew = await this.cache.getNewEntity(hash);
          if (entityNew) {
            found.push(lodash.cloneDeep(entityNew));
          } else {
            notFound.push(hash);
          }
        }
      })
    );

    if (notFound.length === 0) {
      return {
        entities: found,
      };
    }

    if (!this.base) {
      throw new Error('Based store not defined');
    }

    // if not found, then ask the base store
    const result = await this.base.getEntities(notFound);

    if (result.entities.length !== notFound.length) {
      throw new Error(`Entities not found ${JSON.stringify(notFound)}`);
    }

    const entities = found.concat(result.entities);

    // cache the read entities
    if (this.cacheEnabled) {
      entities.forEach((entity) => {
        this.cache.cacheEntity(entity);
      });
    }

    // and return them
    return { entities };
  }

  storeEntities(entities: EntityCreate[]): Promise<Entity[]> {
    return Promise.all(entities.map((e) => this.storeEntity(e)));
  }

  async storeEntity(entity: EntityCreate): Promise<Entity> {
    const entityVer = await this.hashEntity(entity);
    entityVer.remote = entity.remote;

    validateEntities([entityVer], [entity]);

    this.cache.putEntity(entityVer);

    /** return the hash */
    return entityVer;
  }

  async removeEntities(hashes: string[]): Promise<void> {
    await Promise.all(hashes.map((hash) => this.removeEntity(hash)));
  }

  async removeEntity(hash: string): Promise<void> {
    return this.cache.removeEntity(hash);
  }

  async getEntity<T = any>(uref: string): Promise<Entity> {
    const { entities } = await this.getEntities([uref]);
    return entities[0] as Entity<T>;
  }

  async hashEntity<T = any>(entity: EntityCreate): Promise<Entity<T>> {
    const hashed = await this.hashEntities([entity]);
    return hashed[0];
  }
}
