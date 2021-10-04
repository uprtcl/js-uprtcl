import { Entity } from './entity';
import { EveesMutation, NewPerspective, PerspectiveDetails, SearchOptions, Update } from './types';

export interface CachedUpdate {
  update: Update;
  levels?: number;
}

/** A ClientMutation is a service that persists and manipulates an EveesMutation. */
export interface ClientMutationStore {
  newPerspective(newPerspective: NewPerspective): Promise<void>;
  addUpdate(update: Update): Promise<void>;
  deletePerspective(perspectiveId: string): Promise<void>;

  getNewPerspectives(): Promise<NewPerspective[]>;
  getNewPerspective(perspectiveId: string): Promise<NewPerspective | undefined>;
  deleteNewPerspective(perspectiveId: string): Promise<void>;

  getUpdates(): Promise<Update[]>;
  getUpdatesOf(perspectiveId: string): Promise<Update[]>;

  getDeletedPerspectives(): Promise<string[]>;

  diff(options?: SearchOptions): Promise<EveesMutation>;

  clearPerspective(perspectiveId: string): Promise<void>;
  clear(elements?: EveesMutation): Promise<void>;

  /** if the perspective was created and/or has been update, this shall return
   * its latest details */
  getPerspective(perspectiveId: string): Promise<PerspectiveDetails | undefined>;
}
