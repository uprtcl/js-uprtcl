import { TemplateResult } from 'lit-element';

import { Behaviour } from '../../patterns/interfaces/behaviour';
import { Secured } from '../../cas/utils/cid-hash';

import { Client, EveesMutation } from './client';
import { RemoteEvees } from './remote.evees';

export interface Perspective {
  remote: string;
  path: string;
  creatorId: string;
  context: string;
  timestamp: number;
  meta?: any; // optional parameters handle arbitrary metadata
}

/** Perspective input used to create a new perspective */
export interface PartialPerspective {
  remote?: string;
  path?: string;
  creatorId?: string;
  context?: string;
  timestamp?: number;
  meta?: any;
}

export interface PerspectiveDetails {
  headId?: string | undefined;
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

export interface UpdateRequest {
  fromPerspectiveId?: string;
  oldHeadId?: string;
  perspectiveId: string;
  newHeadId: string;
}

export interface Proposal {
  creatorId?: string;
  timestamp?: number;
  toPerspectiveId: string;
  fromPerspectiveId?: string;
  toHeadId?: string;
  fromHeadId?: string;
  mutation: EveesMutation;
}
export interface ProposalCreatedDetail {
  remote: string;
  proposal: Proposal;
}

export const PROPOSAL_CREATED_TAG: string = 'evees-proposal';

export class ProposalCreatedEvent extends CustomEvent<ProposalCreatedDetail> {
  constructor(eventInitDict?: CustomEventInit<ProposalCreatedDetail>) {
    super(PROPOSAL_CREATED_TAG, eventInitDict);
  }
}

export interface PerspectiveLinks {
  /** the parent is unique and is used to have a sense of the 'true' location of a perspective. */
  parentId?: string;
  /** the children can be many and one perspective can be the child of many others. Children are considered
   * part of the parent, and thus are fetched with the parent, searched with the parent, merged with the parent
   * and so on */
  children?: string[];
  /** links are not children, they represent relations between this perspective and another without consider the
   * other to be part of this one */
  linksTo?: string[];
}

export interface NewPerspectiveData {
  perspective: Secured<Perspective>;
  details: PerspectiveDetails;
  links?: PerspectiveLinks;
}

export interface Lens {
  name: string;
  render: (entity: any, context?: any) => TemplateResult;
  type?: string;
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
