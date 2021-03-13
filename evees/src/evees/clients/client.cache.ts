import { EveesMutation, NewPerspective, PerspectiveDetails, Update } from '../interfaces/types';

export interface CachedDetails {
  details: PerspectiveDetails;
  levels?: number;
}

export interface ClientCache {
  clearCachedPerspective(perspectiveId: string): Promise<void>;
  getCachedPerspective(perspectiveId: string): Promise<CachedDetails | undefined>;
  setCachedPerspective(perspectiveId: string, details: CachedDetails): Promise<void>;

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
