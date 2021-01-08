import { Entity } from '@uprtcl/cortex';
import { Secured } from 'src/utils/cid-hash';
import {
  UpdateRequest,
  NewPerspectiveData,
  PerspectiveDetails,
  Perspective,
  PartialPerspective,
  PerspectiveLinks,
} from '../types';
import { SearchEngine } from './search.engine';

/** the perspective data included by a remote as part of a slice */
export interface PerspectiveAndDetails {
  id: string;
  details: PerspectiveDetails;
}

export interface Slice {
  perspectives: PerspectiveAndDetails[];
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

export interface ObjectOnRemote {
  object: object;
  remote: string;
}

export interface EveesMutation {
  newPerspectives: NewPerspectiveData[];
  updates: UpdateRequest[];
  deletedPerspectives: string[];
}

export interface EveesMutationCreate {
  newPerspectives?: NewPerspectiveData[];
  updates?: UpdateRequest[];
  deletedPerspectives?: string[];
}

// All evees clients must call the .on('') method with in the following cases
// 'updated': When an perspective head is new.
// 'logged-status-changed': When the logges status has changed.
// 'canUpdate': When the logged user canUpdate status over a perspective changes.

export interface Client {
  searchEngine?: SearchEngine;

  /** get a perspective head,
   * include a Slice that can be used by the client to pre-fill the cache */
  getPerspective(perspectiveId: string): Promise<PerspectiveGetResult>;

  /** a custom method that search other perspectives based on the logged user,
   * its kept aside from the searchEngine.otherPerspectives method because we need
   * cache and reactivity of the results this is not possible for the searchEngine.  */
  getUserPerspectives(perspectiveId: string): Promise<string[]>;

  /** a method to get he perpective entity, witht he correct hash,
   * without actually creating it in the remote */
  snapPerspective(
    perspective: PartialPerspective,
    links?: PerspectiveLinks
  ): Promise<Secured<Perspective>>;

  /** force refresh the perspective details and deletes the cached proposals and userPerspectives. */
  refresh(): Promise<void>;

  /** create/update perspectives */
  update(mutation: EveesMutationCreate);

  /** get hashed entities */
  getEntities(hashes: string[]): Promise<EntityGetResult>;

  /** store hashed objects
   * must include the remote in which the entities should be ultimately stored */
  storeEntities(objects: object[], remote?: string): Promise<Entity<any>[]>;

  /** an interface to hash objects without storing them
   * (this way they are hashed with the correct CIDConfig and can be considered valid
   * even if they have not been stored) */
  hashEntities(objects: object[], remote?: string): Promise<Entity<any>[]>;

  /** get all the changes relative to the underlying client(s) */
  diff(): Promise<EveesMutation>;
  /** sync all the temporary changes made on this client with the base layer */
  flush(): Promise<void>;

  /** returns true if the user can update the perspective */
  canUpdate(perspectiveId: string, userId?: string): Promise<boolean>;

  /** a couple of handy endpoints to just get or store one entity and not have to filter EntityGetResult */
  getEntity(uref: string): Promise<Entity<any>>;
  storeEntity(object: object, remote: string): Promise<string>;
  hashEntity(object: object, remote: string): Promise<string>;
}
