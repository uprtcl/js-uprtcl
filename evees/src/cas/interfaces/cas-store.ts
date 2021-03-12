import { Slice } from '../../evees/interfaces/types';
import { Entity, EntityCreate, EntityOn, ObjectOn } from './entity';

export interface EntityGetResult {
  entities: Entity[];
  slice?: Slice;
}

/**
 */
export interface CASStore {
  /** an external entry point to cache entities, the entities are not considered new and are thus not
   * sent to the base layer */
  cacheEntities(entities: Entity[]): Promise<void>;

  /** store already-hashed objects
   * must include the remote in which the entities should be ultimately stored */
  storeEntities(entities: EntityCreate[]): Promise<Entity[]>;

  /** an interface to hash objects without storing them
   * (this way they are hashed with the correct CIDConfig and can be considered valid
   * even if they have not been stored) */
  hashEntities(entities: EntityCreate[]): Promise<Entity[]>;

  /** get hashed entities */
  getEntities(hashes: string[]): Promise<EntityGetResult>;

  /** persist all the entities on the base layer */
  flush(): Promise<void>;

  /** list all the new entities created relative to this store base store */
  diff(): Promise<Entity[]>;

  /** delete all the entities on the base layer */
  clear?(): Promise<void>;

  /** a few handy endpoints to just get or store one entity and not have to filter EntityGetResult */
  getEntity<T = any>(hash: string): Promise<Entity<T>>;
  storeEntity(entity: EntityCreate): Promise<Entity>;
  hashEntity<T = any>(entity: EntityCreate): Promise<Entity<T>>;
}
