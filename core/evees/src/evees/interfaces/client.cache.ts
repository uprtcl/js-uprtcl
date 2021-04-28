import { Entity } from './entity';
import { EveesMutation, NewPerspective, SearchOptions, Update } from './types';

export interface CachedUpdate {
  update: Update;
  levels?: number;
}

export interface ClientCache {
  clearCachedPerspective(perspectiveId: string): Promise<void>;
  getCachedPerspective(perspectiveId: string): Promise<CachedUpdate | undefined>;
  setCachedPerspective(perspectiveId: string, details: CachedUpdate): Promise<void>;

  newPerspective(newPerspective: NewPerspective): Promise<void>;
  addUpdate(update: Update, timestamp: number): Promise<void>;
  deletedPerspective(perspectiveId: string): Promise<void>;
  storeEntity(entity: Entity): Promise<void>;

  deleteNewPerspective(perspectiveId: string): Promise<void>;

  getNewPerspectives(): Promise<NewPerspective[]>;
  getNewPerspective(perspectiveId: string): Promise<NewPerspective | undefined>;

  getUpdates(): Promise<Update[]>;
  getUpdatesOf(perspectiveId: string): Promise<Update[]>;

  getDeletedPerspectives(): Promise<string[]>;

  diff(options?: SearchOptions): Promise<EveesMutation>;

  clearPerspective(perspectiveId: string): Promise<void>;
  clear(elements?: EveesMutation): Promise<void>;
}
