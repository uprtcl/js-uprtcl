import { EveesMutation, NewPerspective, PerspectiveDetails, Update } from '../interfaces/types';

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
  deletedPerspective(perspectiveId: string);

  deleteNewPerspective(perspectiveId: string);

  getNewPerspectives(): Promise<NewPerspective[]>;
  getNewPerspective(perspectiveId: string): Promise<NewPerspective | undefined>;

  getUpdates(): Promise<Update[]>;
  getUpdatesOf(perspectiveId: string): Promise<Update[]>;

  getDeletedPerspective(): Promise<string[]>;

  clearPerspective(perspectiveId: string);

  diff(): Promise<EveesMutation>;
  clear(): Promise<void>;
}
