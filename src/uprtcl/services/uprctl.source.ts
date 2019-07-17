import { Observable } from 'rxjs';
import { Source } from '../../discovery/sources/source';

export interface UprtclSource extends Source {
  /**
   * Get the head of a perspective
   * @param perspectiveId id of the perspective to get the head of
   * @returns the id of the head commit of the perspective, if exists
   */
  getHead(perspectiveId: string): Observable<string | undefined>;
}
