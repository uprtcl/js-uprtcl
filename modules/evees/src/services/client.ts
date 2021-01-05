import { Entity } from '@uprtcl/cortex';
import { UpdateRequest, NewPerspectiveData, PerspectiveDetails } from '../types';

/** the perspective data included by a remote as part of a slice */
export interface PerspectiveSlice {
  id: string;
  headId: string;
  canUpdate: boolean;
}

export interface Slice {
  perspectives: PerspectiveSlice[];
  entities: Entity<any>[];
}

export interface PerspectiveGetResult {
  details: PerspectiveDetails;
  slice?: Slice;
}

export interface EntityGetResult {
  entities: Entity<any>[];
  slice?: Slice;
}

// All evees clients must call the .on('') method with in the following cases
// 'updated': When an perspective head is new.
// 'logged-status-changed': When the logges status has changed.
// 'canUpdate': When the logged user canUpdate status over a perspective changes.

export interface Client {
  searchEngine?: SearchEngine;
  proposals?: Proposals;

  /** get a perspective head,
   * include a Slice that can be used by the client to pre-fill the cache */
  getPerspective(perspectiveId: string): Promise<PerspectiveGetResult>;

  /** get hashed entities */
  getEntities(hashes: string[]): Promise<EntityGetResult>;

  /** create/update perspectives */
  createPerspectives(newPerspective: NewPerspectiveData[], updates: UpdateRequest[]);

  /** store hashed objects */
  storeEntities(entities: object[]);

  /** sync all the temporary changes made on this client with the base layer */
  flush(): Promise<void>;

  /** returns true if the user can update the perspective */
  canUpdate(userId: string, perspectiveId: string): Promise<boolean>;

  /** an handy endpoint to just get one entity and not have to filter EntityGetResult */
  getEntity(uref: string): Promise<Entity<any> | undefined>;
}
