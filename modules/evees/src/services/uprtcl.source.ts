import { Source } from '@uprtcl/cortex';
import { Secured } from '@uprtcl/common';

import { Perspective, PerspectiveDetails } from '../types';

export interface UprtclSource extends Source {

  /**
   * Returns all the perspectives associated to a context
   *
   * @param context The context
   */
  getContextPerspectives(context: string): Promise<Secured<Perspective>[]>;

  /**
   * Get the details of a perspective
   * @param perspectiveId id of the perspective
   * @returns the headId, the context and the name of the perspective
   */
  getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails>;

}
