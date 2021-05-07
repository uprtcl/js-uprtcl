import {
  Update,
  NewPerspective,
  EveesMutationCreate,
  PerspectiveGetResult,
  GetPerspectiveOptions,
  SearchOptions,
  SearchResult,
} from './types';
import { EventEmitter } from 'events';
import { Proposals } from '../proposals/proposals';
import { Entity, EntityCreate } from './entity';

export enum ClientEvents {
  updated = 'updated',
  ecosystemUpdated = 'ecosystem-updated',
}

/** A Client can store mutable references (perspectives) and support basic CRUD operation on them.
 * The content of a perspective is reduced to a single hash of its head commit..
 *
 * An evees mutation is a batch of Create, Update or Delete operations that also includes
 * the ids of the entities referenced in the mutation. */
export interface Client {
  readonly events?: EventEmitter;
  readonly proposals?: Proposals;

  /** get a perspective head,
   * include a Slice that can be used by the client to pre-fill the cache */
  getPerspective(
    perspectiveId: string,
    options?: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult>;

  /** create/update perspectives and entities in batch */
  update(mutation: EveesMutationCreate): Promise<void>;

  /** convenient methods to edit a single perspective or set one entity at a time */
  newPerspective(newPerspective: NewPerspective): Promise<void>;
  deletePerspective(perspectiveId: string): Promise<void>;
  updatePerspective(update: Update): Promise<void>;

  /** await for all update transactions received to be processed (visible to read queries) */
  ready?(): Promise<void>;

  /** returns true if the user can update the perspective */
  canUpdate(perspectiveId: string, userId?: string): Promise<boolean>;
}
