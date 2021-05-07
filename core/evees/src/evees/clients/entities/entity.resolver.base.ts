import { Entity, EntityCreate } from 'src/evees/interfaces/entity';
import { EntityCache } from 'src/evees/interfaces/entity.cache';
import { EntityResolver } from '../../interfaces/entity.resolver';
import { OnMemoryEntityCache } from './entity.cache';

/**
 * The entity resolver is used to get and cache entities.
 * New entities are persisted in the remotes from the ClientRemotes and not from here.
 *
 * The reason fot this is that the conditions over which and entity should be persisted
 * are given by the ClientMutation logic.
 * */
export class EntityResolverBase implements EntityResolver {
  cache: EntityCache;

  constructor(protected base: EntityResolver, cache?: EntityCache) {
    this.cache = cache ? cache : new OnMemoryEntityCache();
  }

  async storeEntity(entity: Entity<any>): Promise<void> {
    this.storeEntities([entity]);
  }

  async storeEntities(entities: Entity<any>[]): Promise<void> {
    await this.cache.storeEntities(entities);
  }

  async getEntity<T = any>(hash: string): Promise<Entity<T>> {
    const entities = await this.getEntity(hash);
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

  hashObjects(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    return this.base.hashObjects(entities);
  }

  async removeEntity(hash: string): Promise<void> {
    await this.cache.removeEntity(hash);
    this.base.removeEntity(hash);
  }

  hashObject<T = any>(entity: EntityCreate<any>): Promise<Entity<T>> {
    return this.base.hashObject(entity);
  }
}
