import { Entity, EntityCreate } from './entity';

/** An entity resolver is focused on resolving hashed objects
 * from their hashes. While you can still force entities to
 * be stored by the resolver, entities persistance is handled
 * by another service called EntityRemote */
export interface EntityResolver {
  putEntity(entity: Entity): Promise<void>;
  putEntities(entities: Entity[]): Promise<void>;

  removeEntity(hash: string): Promise<void>;

  getEntity<T = any>(entityId: string): Promise<Entity<T>>;
  getEntities(entitiesIds: string[]): Promise<Entity<any>[]>;

  hashObjects(entities: EntityCreate[], putFlag?: boolean): Promise<Entity[]>;
  hashObject<T = any>(entity: EntityCreate, putFlag?: boolean): Promise<Entity<T>>;
}
