import { CachedUpdate } from './client.mutation.store';
import { Entity } from './entity';

/** A ClientCache caches the details (head) of perspectives. */
export interface ClientCache {
  clearCachedPerspective(perspectiveId: string): Promise<void>;
  getCachedPerspective(perspectiveId: string): Promise<CachedUpdate | undefined>;
  setCachedPerspective(perspectiveId: string, details: CachedUpdate): Promise<void>;

  getCachedEntity(hash: string): Promise<Entity | undefined>;
  cacheEntity(entity: Entity): Promise<void>;
}
