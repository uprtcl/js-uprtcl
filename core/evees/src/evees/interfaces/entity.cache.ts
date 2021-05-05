import { Entity } from './entity';

export interface EntityCache {
  getEntities(hashes: string[]): Promise<Entity[]>;
  getEntity<T = any>(hash: string): Promise<Entity<T>>;

  storeEntity(entity: Entity): Promise<void>;
  storeEntities(entities: Entity[]): Promise<void>;

  removeEntity(entityId: string): Promise<void>;
}
