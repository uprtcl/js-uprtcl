import { PerspectiveDetails, NewPerspectiveData } from '../types';
import { EveesSource } from './evees.source';

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
  createPerspective(newPerspectiveData: NewPerspectiveData): Promise<void>;

  /**
   * Batch call to cloneAndInitPerspective
   *
   * @param newPerspectivesData: TBW
   */
  createPerspectiveBatch(
    newPerspectivesData: NewPerspectiveData[]
  ): Promise<void>;

  /** Modifiers */

  /**
   * Update details of the perspective
   *
   * @param perspectiveId id of the perspective of which to update the head
   * @param details details to update the perspective to
   */
  updatePerspective(
    perspectiveId: string,
    details: Partial<PerspectiveDetails>
  ): Promise<void>;
}
