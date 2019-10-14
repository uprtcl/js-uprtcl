import { Secured, NamedSource } from '@uprtcl/cortex';

import { Perspective } from '../types';

export interface UprtclSource extends NamedSource {
  /**
   * Returns all the perspectives associated to a context
   *
   * @param context The context
   */
  getContextPerspectives(context: string): Promise<Secured<Perspective>[]>;

  /**
   * Get the head of a perspective
   * @param perspectiveId id of the perspective to get the head of
   * @returns the id of the head commit of the perspective, if exists
   */
  getPerspectiveHead(perspectiveId: string): Promise<string | undefined>;

  /**
   * Get the head of a perspective
   * @param perspectiveId id of the perspective to get the head of
   * @returns the id of the head commit of the perspective, if exists
   */
  getPerspectiveContext(perspectiveId: string): Promise<string | undefined>;
}
