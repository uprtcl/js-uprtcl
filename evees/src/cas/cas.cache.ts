import { Entity } from './interfaces/entity';

export interface CASCache {
  getCachedEntity(hash: string): Promise<Entity | undefined>;
  getNewEntity(hash: string): Promise<Entity | undefined>;

  /** cached entities are not considered new wrt the base store */
  cacheEntity(entity: Entity): Promise<void>;

  /** put entities are considered new wrt the base */
  putEntity(entity: Entity): Promise<void>;

  /** removes an entity from the newEntity array */
  removeEntity(hash: string): Promise<void>;

  diff(): Promise<Entity[]>;

  clear(): Promise<void>;
}
