import { CASStore } from '../../cas/interfaces/cas-store';
import { Entity } from '../../cas/interfaces/entity';

import { Update, NewPerspective, PerspectiveDetails } from './types';
import { SearchEngine } from './search.engine';
import { EventEmitter } from 'events';
import { Proposals } from '../proposals/proposals';

export enum ClientEvents {
  updated = 'updated',
}

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

export interface EveesMutation {
  newPerspectives: NewPerspective[];
  updates: Update[];
  deletedPerspectives: string[];
}

export interface EveesMutationCreate {
  newPerspectives?: NewPerspective[];
  updates?: Update[];
  deletedPerspectives?: string[];
}

// All evees clients must call the .on('') method with in the following cases
// 'updated': When an perspective head is new.
// 'logged-status-changed': When the logges status has changed.
// 'canUpdate': When the logged user canUpdate status over a perspective changes.

export interface Client {
  readonly store: CASStore;
  readonly searchEngine: SearchEngine;
  readonly events?: EventEmitter;
  readonly proposals?: Proposals;

  /** get a perspective head,
   * include a Slice that can be used by the client to pre-fill the cache */
  getPerspective(perspectiveId: string): Promise<PerspectiveGetResult>;

  /** create/update perspectives and entities in batch */
  update(mutation: EveesMutationCreate);

  /** convenient methods to edit a single perspective at a time */
  newPerspective(newPerspective: NewPerspective): Promise<void>;
  deletePerspective(perspectiveId: string): Promise<void>;
  updatePerspective(update: Update): Promise<void>;

  /** get all the changes relative to the underlying client(s) */
  diff(): Promise<EveesMutation>;
  /** sync all the temporary changes made on this client with the base layer */
  flush(): Promise<void>;
  /** force refresh the perspective details and deletes the cached proposals and userPerspectives. */
  refresh(): Promise<void>;

  /** a custom method that search other perspectives based on the logged user,
   * its kept aside from the searchEngine.otherPerspectives method because we need
   * cache and reactivity of the results this is not possible for the searchEngine.  */
  getUserPerspectives(perspectiveId: string): Promise<string[]>;

  /** returns true if the user can update the perspective */
  canUpdate(perspectiveId: string, userId?: string): Promise<boolean>;
}
