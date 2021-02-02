import { TemplateResult } from 'lit-element';

import { Behaviour } from '../../patterns/interfaces/behaviour';
import { Secured } from '../../cas/utils/cid-hash';

import { Client } from './client';
import { RemoteEvees } from './remote.evees';

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
  linkChanges?: LinkChanges;
  oldDetails?: PerspectiveDetails;
  fromPerspectiveId?: string;
}

/** Each update can optionally include the changes in the way a persective is
 * connected/linked with other objects. We have a special type of link called children
 * which explicitely considers the link a child and a part of the parent, and can be used
 * for recurse-by-default operations */

export interface LinkChanges {
  children: {
    added: string[];
    removed: string[];
  };
  linksTo: {
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

/** Helper interface with info typically needed by high level user interfaces to create a new perspective */
export interface CreateEvee {
  remoteId?: string;
  object?: any;
  partialPerspective?: PartialPerspective;
  guardianId?: string;
}

export interface DiffLens {
  name: string;
  render: (client: Client, newEntity: any, oldEntity: any, summary: boolean) => TemplateResult;
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
