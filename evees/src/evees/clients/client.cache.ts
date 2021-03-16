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
  addUpdate(update: Update): Promise<void>;
  deletedPerspective(perspectiveId: string);

  deleteNewPerspective(perspectiveId: string);

  getNewPerspectives(): Promise<NewPerspective[]>;
  getUpdates(): Promise<Update[]>;
  getDeletedPerspective(): Promise<string[]>;

  diff(): Promise<EveesMutation>;
  clear(): Promise<void>;
}
