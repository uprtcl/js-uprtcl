import { Entity, EntityCreate } from './entity';

/** An entity resolver is able to store hashed objects, and
 * return objects from out of their hashes */
export interface EntityResolver {
  storeEntity(entity: Entity): Promise<void>;
  storeEntities(entities: Entity[]): Promise<void>;

  getEntity<T = any>(entityId: string): Promise<Entity<T>>;
  getEntities(entitiesIds: string[]): Promise<Entity<any>[]>;

  removeEntity(entityId: string): Promise<void>;

  hashObjects(entities: EntityCreate[]): Promise<Entity[]>;
  hashObject<T = any>(entity: EntityCreate): Promise<Entity<T>>;
}
