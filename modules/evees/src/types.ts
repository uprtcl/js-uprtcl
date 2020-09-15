import { TemplateResult } from 'lit-element';

import { Behaviour } from '@uprtcl/cortex';
import { CASStore } from '@uprtcl/multiplatform';

import { EveesRemote } from './services/evees.remote';
import { Secured } from './utils/cid-hash';
import { EveesWorkspace } from './services/evees.workspace';

export type RemoteMap = (eveesAuthority: EveesRemote, contentType?: string) => CASStore;

export const defaultRemoteMap: RemoteMap = (eveesAuthority: EveesRemote, contentType?: string) =>
  eveesAuthority.store;

export type Context = string;

export interface Perspective {
  remote: string;
  path: string;
  creatorId: string;
  timestamp: number;
}

export const getAuthority = (perspective: Perspective): string => {
  return `${perspective.remote}:${perspective.path}`;
};

export interface PerspectiveDetails {
  name?: string;
  context?: string | undefined;
  headId?: string | undefined;
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
  id: string;
  creatorId?: string;
  timestamp?: number;
  toPerspectiveId: string;
  fromPerspectiveId?: string;
  toHeadId?: string;
  fromHeadId?: string;
  details: ProposalDetails;
}

export interface ProposalDetails {
  updates: UpdateRequest[];
  newPerspectives: NewPerspectiveData[];
}

export interface NewProposal {
  fromPerspectiveId: string;
  toPerspectiveId: string;
  fromHeadId: string;
  toHeadId: string;
  details: ProposalDetails;
}

export interface ProposalCreatedDetail {
  proposalId: string;
  remote: string;
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
  render: (
    workspace: EveesWorkspace,
    newEntity: any,
    oldEntity: any,
    summary: boolean
  ) => TemplateResult;
  type?: string;
}

export interface HasDiffLenses<T = any> extends Behaviour<T> {
  diffLenses: () => DiffLens[];
}
