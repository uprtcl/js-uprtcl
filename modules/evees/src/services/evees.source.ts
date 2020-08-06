import { CASStore } from '@uprtcl/multiplatform';

import { PerspectiveDetails } from '../types';

export interface EveesSource {
  store: CASStore;

  /**
   * Returns all the perspectives associated to a context
   *
   * @param context The context
   */
  getContextPerspectives(context: string): Promise<string[]>;

  /**
   * Get the details of a perspective
   * @param perspectiveId id of the perspective
   * @returns the headId, the context and the name of the perspective
   */
  getPerspective(perspectiveId: string): Promise<PerspectiveDetails>;
}
