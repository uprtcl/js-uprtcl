import { Entity } from '@uprtcl/cortex';
import { UpdateRequest, NewPerspectiveData } from '../types';

/** A "Delta" is a Set of objects that describe changes made relative to an EveesClient state. It includes
 * a list of new perspectives (mutable references).
 * a list of updates to existing perspectives.
 * a list of entities (hashed objects) that are referenced by the list above.
 */
export interface Delta {
  newPerspectives: NewPerspectiveData[];
  updates: UpdateRequest[];
  entities: Entity<any>[];
}

export interface EveesClient {
  /** create new perspectives */
  getPerspective(perspectiveId: string): Promise<{ head: string; delta: Delta }>;

  /** create new perspectives */
  newPerspectives(newPerspective: NewPerspectiveData[]);
  /** updated existing perspectives (can be newPerspectives too) */
  update(update: UpdateRequest[]);
  /** store hashed objects */
  put(entities: Entity<any>[]);
  /** sync all the temporary chhanges made on this client on its base client */
  flush();

  /** for performance reasons, we need a place to cache the query "get other perspectives",
   * without having to ask the remote filter everytime.
   * But caching a other perspectives of user seems possible and is enough.*/
  userPerspective(userId: string, ofPerspectiveId: string);

  canUpdate(userId: string, perspectiveId: string);
}
