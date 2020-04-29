import { TemplateResult } from 'lit-element';

import { Behaviour } from '@uprtcl/cortex';
import { CASStore } from '@uprtcl/multiplatform';

import { EveesRemote } from './services/evees.remote';
import { Secured } from './utils/cid-hash';
import { EveesWorkspace } from './services/evees.workspace';

export type RemoteMap = (eveesAuthority: EveesRemote, contentType?: string) => CASStore;

export const defaultRemoteMap: RemoteMap = (eveesAuthority: EveesRemote, contentType?: string) =>
  eveesAuthority;

export type Context = string;

export interface Perspective {
  authority: string;
  creatorId: string;
  timestamp: number;
}

export interface PerspectiveDetails {
  name?: string;
  context?: string | undefined;
  headId?: string | undefined;
}

export interface Commit {
  creatorsIds: string[];
  timestamp: number;
  message: string | undefined;
  parentsIds: Array<string>;
  dataId: string;
}

export interface UpdateRequest {
  fromPerspectiveId?: string | undefined;
  oldHeadId?: string | undefined;
  perspectiveId: string;
  newHeadId: string;
}

export interface Proposal {
  id: string;
  creatorId?: string;
  toPerspectiveId?: string;
  fromPerspectiveId: string;
  toHeadId?: string;
  fromHeadId?: string;
  updates?: Array<UpdateRequest>;
  status?: boolean;
  authorized?: boolean;
  executed?: boolean;
  canAuthorize?: boolean;
}

export interface NewProposal {
  fromPerspectiveId: string;
  toPerspectiveId: string;
  fromHeadId: string;
  toHeadId: string;
  updates: UpdateRequest[];
}

export interface ProposalCreatedDetail {
  proposalId: string;
  authority: string;
}

export class ProposalCreatedEvent extends CustomEvent<ProposalCreatedDetail> {
  constructor(eventInitDict?: CustomEventInit<ProposalCreatedDetail>) {
    super('evees-proposal-created', eventInitDict);
  }
}

export interface NewPerspectiveData {
  perspective: Secured<Perspective>;
  details: PerspectiveDetails;
  canWrite?: string;
  parentId?: string;
}

export interface DiffLens {
  name: string;
  render: (workspace: EveesWorkspace, newEntity: any, oldEntity: any) => TemplateResult;
  type?: string;
}

export interface HasDiffLenses<T = any> extends Behaviour<T> {
  diffLenses: () => DiffLens[];
}
