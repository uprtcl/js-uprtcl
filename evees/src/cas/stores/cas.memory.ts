import { CASStore, EntityGetResult } from '../interfaces/cas-store';
import { Entity, EntityOnRemote, ObjectOnRemote } from '../interfaces/entity';

/** The CASOnMemory caches the created and read entities on memory.
 * When the flush() function is called, it stores all the cached created
 * entities on the base CASStore */
export class CASOnMemory implements CASStore {
  private newEntities = new Map<string, EntityOnRemote>();
  private cachedEntities = new Map<string, Entity<any>>();

  /** The base CASStore can be a better persisted CASStore in IndexedDB or the CAS router which will
   * connect to remote stores like IPFS or a web server.
   */
  constructor(protected base: CASStore) {}

  async cacheEntities(entities: Entity<any>[]): Promise<void> {
    entities.forEach((entity) => this.cachedEntities.set(entity.id, entity));
  }

  async hashEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    return this.base.hashEntities(objects);
  }

  async flush(): Promise<void> {
    const newEntities = Array.from(this.newEntities.values());
    /** remove the id, it was temporarily set to be able to read from the newEntities buffer */
    const objectsOnRemote = newEntities.map((entityOnRemote) => {
      return {
        object: entityOnRemote.entity.object,
        remote: entityOnRemote.remote,
      };
    });

    /** store the objects on the base layer */
    await this.base.storeEntities(objectsOnRemote);

    /** add the entities to the cached entities */
    newEntities.forEach((entityOnRemote) =>
      this.cachedEntities.set(entityOnRemote.entity.id, entityOnRemote.entity)
    );

    /** clear the newEntities buffer */
    this.newEntities.clear();
  }

  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const found: Entity<any>[] = [];
    const notFound: string[] = [];

    /** Check the cache */
    hashes.forEach((hash) => {
      const entityCached = this.cachedEntities.get(hash);
      if (entityCached) {
        found.push(entityCached);
      } else {
        /** Check the new entities buffer */
        const entityNew = this.newEntities.get(hash);
        if (entityNew) {
          found.push(entityNew.entity);
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

  storeEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    return Promise.all(
      objects.map(async (o) => {
        const hash = await this.storeEntity(o);
        return {
          id: hash,
          object: o.object,
          remote: o.remote,
        };
      })
    );
  }

  async storeEntity(object: ObjectOnRemote): Promise<string> {
    /** Hash using the base layer */
    const hash = await this.base.hashEntity(object);
    /** Store in the new entities buffer */
    this.newEntities.set(hash, {
      entity: { id: hash, object: object.object },
      remote: object.remote,
    });
    /** return the hash */
    return hash;
  }

  async getEntity<T = any>(uref: string): Promise<Entity<any>> {
    const { entities } = await this.getEntities([uref]);
    return entities[0] as Entity<T>;
  }

  hashEntity(object: ObjectOnRemote): Promise<string> {
    return this.base.hashEntity(object);
  }
}
