import { ObjectOnRemote, Slice } from '../../evees/interfaces/client';
import { Entity } from './entity';

export interface EntityGetResult {
  entities: Entity<any>[];
  slice?: Slice;
}

/**
 */
export interface CASStore {
  /** store hashed objects
   * must include the remote in which the entities should be ultimately stored */
  storeEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]>;

  /** an interface to hash objects without storing them
   * (this way they are hashed with the correct CIDConfig and can be considered valid
   * even if they have not been stored) */
  hashEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]>;

  /** get hashed entities */
  getEntities(hashes: string[]): Promise<EntityGetResult>;

  /** persist all the entities on the base layer */
  flush(): Promise<void>;

  /** a couple of handy endpoints to just get or store one entity and not have to filter EntityGetResult */
  getEntity(uref: string): Promise<Entity<any>>;
  storeEntity(object: ObjectOnRemote): Promise<string>;
  hashEntity(object: ObjectOnRemote): Promise<string>;
}
