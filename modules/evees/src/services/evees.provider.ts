import { Signed } from '@uprtcl/cortex';

import { Perspective, Commit, PerspectiveDetails } from '../types';
import { EveesSource } from './evees.source';

export interface NewPerspectiveData {
  perspectiveId: string;
  perspective: Signed<Perspective>;
  details: PerspectiveDetails;
  canWrite?: string;
  parentId?: string;
}

export interface EveesProvider extends EveesSource {
  /**
   * Delete a perspective, it is expected that, once called, 
   
   * @param perspectiveId: TBW
   */
  deletePerspective(perspectiveId: string): Promise<void>;

  /**
   * Clone a perspective, set its details and forces a user canWrite in the service. 
   
   * @param newPerspectiveData: TBW
   */
  cloneAndInitPerspective(newPerspectiveData: NewPerspectiveData): Promise<void>;

  /**
   * Batch call to cloneAndInitPerspective
   *
   * @param newPerspectivesData: TBW
   */
  clonePerspectivesBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void>;

  /** Cloners */

  /**
   * Clone a new perspective in the service
   *
   * @param perspective: the signed perspective to create
   */
  clonePerspective(perspectiveId: string, perspective: Signed<Perspective>): Promise<void>;

  /**
   * Clone the given commit in the service
   *
   * @param commit: the signed commit to clone
   */
  cloneCommit(commitId: string, commit: Signed<Commit>): Promise<void>;

  /** Modifiers */

  /**
   * Update details of the perspective
   *
   * @param perspectiveId id of the perspective of which to update the head
   * @param details details to update the perspective to
   */
  updatePerspectiveDetails(
    perspectiveId: string,
    details: Partial<PerspectiveDetails>
  ): Promise<void>;
}
