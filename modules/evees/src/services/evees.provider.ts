import { Secured } from '../patterns/default-secured.pattern';

import { Perspective, Commit, PerspectiveDetails } from '../types';
import { EveesSource } from './evees.source';

export interface NewPerspectiveData {
  perspective: Secured<Perspective>;
  details: PerspectiveDetails;
  canWrite?: string
}

export interface EveesProvider extends EveesSource {

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
  clonePerspective(perspective: Secured<Perspective>): Promise<void>;

  
  /**
   * Clone the given commit in the service
   *
   * @param commit: the signed commit to clone
   */
  cloneCommit(commit: Secured<Commit>): Promise<void>;

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
