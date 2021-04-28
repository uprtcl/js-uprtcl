import { Entity, EntityCreate } from './entity';

/** A CASStore stores entities (hashed objects). Entities can't be updated and thus they can be stored in a different
 * platform or network to the perspectives, which are mutable.
 *
 * Each store can hash the objects with its own algorithm and encoding, as long as the result is a valid CID.
 *
 * When storing new entities, the entity payload should include the remote id where that entity is expected to be
 * stored.*/
export interface CASStore {
  /** store objects which may or may not be already hashed. If hashed */
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
