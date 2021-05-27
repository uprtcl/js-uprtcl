import { Entity, EntityCreate, EntityCache, EntityResolver } from '../../interfaces';
import { OnMemoryEntityCache } from './entity.cache';

/**
 * The entity resolver is used to get and cache entities.
 * New entities are persisted in the remotes from the ClientRemotes and not from here.
 *
 * The reason fot this is that the conditions over which an entity should be persisted
 * are given by the ClientMutation logic.
 * */
export class EntityResolverBase implements EntityResolver {
  cache: EntityCache;

  constructor(protected base: EntityResolver, cache?: EntityCache) {
    this.cache = cache ? cache : new OnMemoryEntityCache();
  }

  putEntity(entity: Entity): Promise<void> {
    return this.putEntities([entity]);
  }

  async putEntities(entities: Entity[]): Promise<void> {
    await this.cache.storeEntities(entities);
  }

  async getEntity<T = any>(hash: string): Promise<Entity<T>> {
    const entities = await this.getEntities([hash]);
    return entities[0];
  }

  async getEntities(hashes: string[]): Promise<Entity<any>[]> {
    const found: Entity[] = [];
    const notFound: string[] = [];

    /** Check the cache */
    await Promise.all(
      hashes.map(async (hash) => {
        const entityCached = await this.cache.getEntity(hash);
        if (entityCached) {
          found.push({ ...entityCached });
        } else {
          notFound.push(hash);
        }
      })
    );

    if (notFound.length === 0) {
      return found;
    }

    // if not found, then ask the base store
    const entities = await this.base.getEntities(notFound);

    if (entities.length !== notFound.length) {
      throw new Error(`Entities not found ${JSON.stringify(notFound)}`);
    }
    // cache just read entities
    this.cache.storeEntities(entities);

    const allEntities = found.concat(entities);

    return allEntities;
  }

  async hashObjects(
    entitiesCreate: EntityCreate<any>[],
    putFlag: boolean = true
  ): Promise<Entity<any>[]> {
    const entities = await this.base.hashObjects(entitiesCreate);
    // cache all hashed objects by default
    if (putFlag) await this.putEntities(entities);
    return entities;
  }

  async hashObject<T = any>(entity: EntityCreate<any>, putFlag?: boolean): Promise<Entity<T>> {
    const entities = await this.hashObjects([entity], putFlag);
    return entities[0];
  }

  async removeEntity(hash: string): Promise<void> {
    await this.cache.removeEntity(hash);
    this.base.removeEntity(hash);
  }
}
