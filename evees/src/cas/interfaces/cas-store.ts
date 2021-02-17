import { Slice } from '../../evees/interfaces/types';
import { Entity, ObjectOn } from './entity';

export interface EntityGetResult {
  entities: Entity<any>[];
  slice?: Slice;
}

/**
 */
export interface CASStore {
  /** an external entry point to cached entities */
  cacheEntities(entities: Entity<any>[]): Promise<void>;

  /** store hashed objects
   * must include the remote in which the entities should be ultimately stored */
  storeEntities(objects: ObjectOn[]): Promise<Entity<any>[]>;

  /** an interface to hash objects without storing them
   * (this way they are hashed with the correct CIDConfig and can be considered valid
   * even if they have not been stored) */
  hashEntities(objects: ObjectOn[]): Promise<Entity<any>[]>;

  /** get hashed entities */
  getEntities(hashes: string[]): Promise<EntityGetResult>;

  /** persist all the entities on the base layer */
  flush(): Promise<void>;

  /** a couple of handy endpoints to just get or store one entity and not have to filter EntityGetResult */
  getEntity<T = any>(hash: string): Promise<Entity<T>>;
  storeEntity(object: ObjectOn): Promise<string>;
  hashEntity(object: ObjectOn): Promise<string>;
}
