import { Entity } from '@uprtcl/cortex';
import { UpdateRequest, NewPerspectiveData, PerspectiveDetails } from '../types';

/** the perspective data included by a remote as part of a slice */
export interface PerspectiveSlice {
  id: string;
  headId: string;
  canWrite: boolean;
}

export interface Slice {
  perspectives: PerspectiveSlice[];
  entities: Entity<any>[];
}

export interface PerspectiveGetResult {
  details: PerspectiveDetails;
  slice?: Slice;
}

export interface EveesClient {
  /** get a perspective head,
   * include a Slice that can be used by the client to optimistically fill the cache */
  getPerspective(perspectiveId: string): Promise<PerspectiveGetResult>;

  /** create new perspectives */
  createPerspectives(newPerspective: NewPerspectiveData[]);
  /** updated existing perspectives (can be newPerspectives too) */
  updatePerspectives(update: UpdateRequest[]);
  /** store hashed objects */
  storeEntities(entities: Entity<any>[]);

  /** sync all the temporary changes made on this client with the base layer */
  flush(): Promise<void>;

  /** returns true if the user can update the perspective */
  canUpdate(userId: string, perspectiveId: string): Promise<boolean>;
}
