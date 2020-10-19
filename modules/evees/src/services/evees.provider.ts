import { PerspectiveDetails, NewPerspectiveData, Perspective } from '../types';
import { EveesSource } from './evees.source';
import { Secured } from '../utils/cid-hash';

export interface EveesProvider extends EveesSource {
  /**
   * Delete a perspective, it is expected that, once called, 
   
   * @param perspectiveId: TBW
   */
  deletePerspective(perspectiveId: string): Promise<void>;

  /**
   * Create a perspective payload entity, inside the context of the remote, and
   * thus with the ability to fetch remote specific information
   
   * @param parentId: (optional) the id of an object to be used as context
   * @param timestamp: (optional)
   * @param path: (optional)
   */
  snapPerspective(
    parentId?: string,
    context?: string,
    timestamp?: number,
    path?: string,
    fromPerspectiveId?: string,
    fromHeadId?: string
  ): Promise<Secured<Perspective>>;

  /**
   * Create a perspective, set its details and configures its access control. 
   
   * @param newPerspectiveData: TBW
   */
  createPerspective(newPerspectiveData: NewPerspectiveData): Promise<void>;

  /**
   * Batch call to cloneAndInitPerspective
   *
   * @param newPerspectivesData: TBW
   */
  createPerspectiveBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void>;

  /** Modifiers */

  /**
   * Update details of the perspective
   *
   * @param perspectiveId id of the perspective of which to update the head
   * @param details details to update the perspective to
   */
  updatePerspective(perspectiveId: string, details: Partial<PerspectiveDetails>): Promise<void>;
}
