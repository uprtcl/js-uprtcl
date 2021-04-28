import { Entity, EntityCreate } from './entity';

export interface CASStore {
  /** store already-hashed objects
   * must include the remoteId in which the entities should be ultimately stored */
  storeEntities(entities: EntityCreate[]): Promise<Entity[]>;
  storeEntity(entity: EntityCreate): Promise<Entity>;

  /** removes the entities from the store */
  removeEntities(hashes: string[]): Promise<void>;

  /** get hashed entities */
  getEntities(hashes: string[]): Promise<Entity[]>;
  getEntity<T = any>(hash: string): Promise<Entity<T>>;

  /** hash objects without storing them
   * (this way they are hashed with the correct CIDConfig and can be considered valid
   * even if they have not been stored) */
  hashEntities(entities: EntityCreate[]): Promise<Entity[]>;
  hashEntity<T = any>(entity: EntityCreate): Promise<Entity<T>>;
}
