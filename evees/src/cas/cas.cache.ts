import { Entity } from './interfaces/entity';

export interface CASCache {
  getCachedEntity(entity: string): Promise<Entity | undefined>;
  getNewEntity(entity: string): Promise<Entity | undefined>;

  /** cached entities are not considered new wrt the base store */
  cacheEntity(entity: Entity): Promise<void>;

  /** put entities are considered new wrt the base */
  putEntity(entity: Entity): Promise<void>;

  diff(): Promise<Entity[]>;

  clear(): Promise<void>;
}
