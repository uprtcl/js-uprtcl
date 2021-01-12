import { Entity } from '@uprtcl/cortex';
import { Slice } from '../services/client';
import { CidConfig } from './cid-config';

export interface EntityGetResult {
  entities: Entity<any>[];
  slice?: Slice;
}

/**
 */
export interface CASStore {
  /** store hashed objects
   * must include the remote in which the entities should be ultimately stored */
  storeEntities(objects: object[], remote: string): Promise<Entity<any>[]>;

  /** an interface to hash objects without storing them
   * (this way they are hashed with the correct CIDConfig and can be considered valid
   * even if they have not been stored) */
  hashEntities(objects: object[], remote: string): Promise<Entity<any>[]>;

  /** get hashed entities */
  getEntities(hashes: string[]): Promise<EntityGetResult>;

  /** persist all the entities on the base layer */
  flush(): Promise<void>;

  /** a couple of handy endpoints to just get or store one entity and not have to filter EntityGetResult */
  getEntity(uref: string): Promise<Entity<any>>;
  storeEntity(object: object, remote: string): Promise<string>;
  hashEntity(object: object, remote: string): Promise<string>;
}
