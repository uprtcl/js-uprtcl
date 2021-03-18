import { TemplateResult } from 'lit-element';

import { Behaviour } from '../../patterns/interfaces/behaviour';
import { Secured } from '../../cas/utils/cid-hash';
import { Entity, EntityCreate } from '../../cas/interfaces/entity';

import { RemoteEvees } from './remote.evees';
import { Evees } from '../evees.service';

/** Core perspective format. A perspective is like a URL, it includes the coordinates to reach a current head.
 * The hash of the perspective is the perspective id. */
export interface Perspective {
  remote: string;
  path: string;
  creatorId: string;
  context: string;
  timestamp: number;
  meta?: any; // optional parameters handle arbitrary metadata
}

/** A remote stores and resolves data to each perspective. The data a remote stores
 * is of type PerspectiveDetails
 * - The head commit (a Commit object with the history of the perspective and current content (under dataId))
 * - The guardianId: Useful to handle access control in general, it specifies from which other perspective, this perspective inherits its access control.
 * - The canUpdate: This is used only when fetching the perspective, and informs whether the current logged user on the remote can update it.
 */
export interface PerspectiveDetails {
  headId?: string;
  guardianId?: string;
  /** for read only */
  canUpdate?: boolean;
}

export interface Commit {
  creatorsIds: string[];
  timestamp: number;
  message?: string;
  forking?: string;
  parentsIds: Array<string>;
  dataId: string;
}

/** An update to perspective is summarized into an Update object */
export interface Update {
  perspectiveId: string;
  details: PerspectiveDetails;
  oldDetails?: PerspectiveDetails;
  fromPerspectiveId?: string;
  indexData?: IndexData;
}

export interface IndexData {
  linkChanges?: LinkChanges;
  text?: string;
}

/** Each update can optionally include the changes in the way a persective is
 * connected/linked with other objects. We have a special type of link called children
 * which explicitely considers the link a child and a part of the parent, and can be used
 * for recurse-by-default operations */

export interface LinkChanges {
  children?: {
    added: string[];
    removed: string[];
  };
  linksTo?: {
    added: string[];
    removed: string[];
  };
  onEcosystem?: {
    added: string[];
    removed: string[];
  };
}

/** Remote interface to create a perspective  */
export interface NewPerspective {
  perspective: Secured<Perspective>;
  update: Update;
}

/** A perspective-like object that is useful as input for functions that can create a new perspective object and
 * some properties are left optional */
export interface PartialPerspective {
  remote?: string;
  path?: string;
  creatorId?: string;
  context?: string;
  timestamp?: number;
  meta?: any;
}

/** Optional entry to be stored under meta.forking */
export interface ForkDetails {
  perspectiveId: string;
  headId?: string;
}

/** Helper interface with info typically needed by high level user interfaces to create a new perspective */
export interface CreateEvee {
  remoteId?: string;
  object?: any;
  partialPerspective?: PartialPerspective;
  /** receive the perspectiveId in case the perspective was already created */
  perspectiveId?: string;
  perspective?: Secured<Perspective>;
  guardianId?: string;
}

export interface GetPerspectiveOptions {
  levels?: number;
  entities?: boolean;
}

export interface PerspectiveAndDetails {
  id: string;
  details: PerspectiveDetails;
}

export interface Slice {
  perspectives: PerspectiveAndDetails[];
  entities: Entity[];
}

export interface PerspectiveGetResult {
  details: PerspectiveDetails;
  slice?: Slice;
}

export interface EveesMutation {
  newPerspectives: NewPerspective[];
  updates: Update[];
  deletedPerspectives: string[];
  entities: Entity[];
}

export interface EveesMutationCreate {
  newPerspectives?: NewPerspective[];
  updates?: Update[];
  deletedPerspectives?: string[];
  entities?: EntityCreate[];
}

export interface SearchOptionsJoin {
  type?: 'AND' | 'OR' | 'XOR';
  negation?: boolean;
  id: string;
}

export interface EveesOptions {
  creatorId?: string;
  createdBefore?: number;
  createdAfter?: number;
  updatedBefore?: number;
  updatedAfter?: number;
}

export interface SearchOptions {
  under?: SearchOptionsJoin[];
  linksTo?: SearchOptionsJoin[];
  text?: {
    value: string;
    levels?: number;
  };
  orderBy?: string;
  pagination?: {
    first: number;
    offset: number;
  };
}

export interface SearchForkOptions {
  levels?: number;
}

export interface SearchResult {
  perspectiveIds: string[];
  ended?: boolean;
  slice?: Slice;
}

export interface ParentAndChild {
  parentId: string;
  childId: string;
}

export interface ForkOf {
  forkId: string;
  ofPerspectiveId: string;
  atHeadId?: string;
}

export interface DiffLens {
  name: string;
  render: (evees: Evees, newEntity: any, oldEntity: any, summary: boolean) => TemplateResult;
  type?: string;
}

export interface HasDiffLenses<T = any> extends Behaviour<T> {
  diffLenses: () => DiffLens[];
}

export interface EveesConfig {
  defaultRemote?: RemoteEvees;
  officialRemote?: RemoteEvees;
  editableRemotesIds?: string[];
  emitIf?: {
    remote: string;
    owner: string;
  };
}

export interface UpdateDetails {
  path: string[];
  newData: Entity;
  oldData?: Entity;
  update: Update;
}

export interface UpdatePerspectiveData {
  perspectiveId: string;
  object: any;
  amend?: boolean;
  onHeadId?: string;
  guardianId?: string;
  indexData?: IndexData;
}
