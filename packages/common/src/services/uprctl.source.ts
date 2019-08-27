import { Observable } from 'rxjs';
import { Secured, Source } from '@uprtcl/cortex';
import { Perspective } from '../types';

export interface UprtclSource extends Source {
  /**
   * Returns all the perspectives associated to a
   * context.
   *
   * @param contextId The context id
   */
  getContextPerspectives(contextId: string): Promise<Secured<Perspective>[]>;

  /**
   * Get the head of a perspective
   * @param perspectiveId id of the perspective to get the head of
   * @returns the id of the head commit of the perspective, if exists
   */
  getHead(perspectiveId: string): Observable<string | undefined>;
}
