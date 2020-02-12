import { Source } from '@uprtcl/multiplatform';
import { EveesRemote } from './services/evees.remote';
import { Secured } from './patterns/default-secured.pattern';
import { Signed, Hashed } from '@uprtcl/cortex';

export type RemoteMap = (eveesAuthority: string, entityName: string) => Source;

export type RemotesConfig = {
  map: RemoteMap;
  defaultCreator: EveesRemote;
};

export type Context = string;

export interface Perspective {
  origin: string;
  creatorId: string;
  timestamp: number;
}

export interface PerspectiveDetails {
  name: string;
  context: string | undefined;
  headId: string | undefined;
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
  entity?: Hashed<any>;
  payload: any;
}
