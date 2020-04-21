import { TemplateResult } from 'lit-element';

import { Entity, Behaviour } from '@uprtcl/cortex';
import { CASSource } from '@uprtcl/multiplatform';

import { EveesRemote } from './services/evees.remote';

export type RemoteMap = (eveesAuthority: EveesRemote, contentType?: string) => CASSource;

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

export interface ProposalCreatedDetail {
  proposalId: string;
  authority: string;
}

export class ProposalCreatedEvent extends CustomEvent<ProposalCreatedDetail> {
  constructor(eventInitDict?: CustomEventInit<ProposalCreatedDetail>) {
    super('evees-proposal-created', eventInitDict);
  }
}

export const CREATE_DATA_ACTION = 'CREATE_DATA';
export const CREATE_COMMIT_ACTION = 'CREATE_COMMIT';
export const CREATE_AND_INIT_PERSPECTIVE_ACTION = 'CREATE_AND_INIT_PERSPECTIVE';
export const UPDATE_HEAD_ACTION = 'UPDATE_HEAD';

export interface UprtclAction {
  type: string;
  entity?: Entity<any>;
  payload: any;
}

export interface NodeActions<T> {
  new: T;
  actions: UprtclAction[];
}

export interface DiffLens {
  name: string;
  render: (newEntity: any, oldEntity: any) => TemplateResult;
  type?: string;
}

export interface HasDiffLenses<T = any> extends Behaviour<T> {
  diffLenses: () => DiffLens[];
}
