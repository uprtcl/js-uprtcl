import { CachedUpdate } from './client.mutation.store';

/** A ClientCache caches the details (head) of perspectives. */
export interface ClientCacheStore {
  clearCachedPerspective(perspectiveId: string): Promise<void>;
  getCachedPerspective(perspectiveId: string): Promise<CachedUpdate | undefined>;
  setCachedPerspective(perspectiveId: string, details: CachedUpdate): Promise<void>;
}
