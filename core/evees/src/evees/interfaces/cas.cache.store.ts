import { Entity } from './entity';

/** A ClientCache caches the details (head) of perspectives. */
export interface CASCacheStore {
  clearCachedEntity(entityId: string): Promise<void>;
  getCachedEntity(entityId: string): Promise<Entity | undefined>;
  setCachedEntity(entity: Entity): Promise<void>;
  setCachedEntities(entities: Entity[]): Promise<void>;
}
