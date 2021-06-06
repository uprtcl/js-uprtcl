import { Entity, EntityCreate, EntityRemote, EntityResolver } from '../../interfaces';
import { EntityResolverBase } from './entity.resolver.base';
import { RouterEntityResolver } from './router.entity.resolver';

/** Wraps an Entity remote to add a buffer for new entities and persist
 * them at once when flush is called.
 *
 * It only store the hashes of the entities and rely on an entity resolver
 * to resolve them when needed */
export class EntityRemoteBuffered implements EntityRemote {
  id: string = '';
  newEntities: Map<string, Entity> = new Map();

  constructor(readonly remote: EntityRemote) {}

  async putEntity(entity: Entity<any>): Promise<void> {
    this.newEntities.set(entity.hash, entity);
  }

  async putEntities(entities: Entity[]): Promise<void> {
    await Promise.all(entities.map((entity) => this.putEntity(entity)));
  }

  async flush(): Promise<void> {
    await this.remote.persistEntities(Array.from(this.newEntities.values()));
    this.newEntities.clear();
  }

  persistEntities(entities: Entity<any>[]): Promise<void> {
    return this.remote.persistEntities(entities);
  }
  persistEntity(entity: Entity<any>): Promise<void> {
    return this.remote.persistEntity(entity);
  }

  hashObjects(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    return this.remote.hashObjects(entities);
  }
  hashObject<T = any>(entity: EntityCreate<any>): Promise<Entity<T>> {
    return this.remote.hashObject(entity);
  }

  removeEntities(hashes: string[]): Promise<void> {
    return this.remote.removeEntities(hashes);
  }

  async getEntities(hashes: string[]): Promise<Entity<any>[]> {
    const found: Entity[] = [];
    const notFound: string[] = [];

    /** Check the cache */
    hashes.forEach(async (hash) => {
      const entityCached = this.newEntities.get(hash);
      if (entityCached) {
        found.push({ ...entityCached });
      } else {
        notFound.push(hash);
      }
    });

    if (notFound.length === 0) {
      return found;
    }

    // if not found, then ask the base store
    const entities = await this.remote.getEntities(notFound);

    if (entities.length !== notFound.length) {
      throw new Error(`Entities not found ${JSON.stringify(notFound)}`);
    }

    const allEntities = found.concat(entities);

    return allEntities;
  }

  async getEntity<T = any>(hash: string): Promise<Entity<T>> {
    const entities = await this.getEntities([hash]);
    return entities[0];
  }
}
