import { Source } from '@uprtcl/multiplatform';
import { EveesRemote } from './services/evees.remote';

export type RemoteMap = (eveesAuthority: string, entityName: string) => Source;

export type RemotesConfig = {
  map: RemoteMap,
  defaultCreator: EveesRemote
}

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
  fromPerspectiveId: string | undefined;
  oldHeadId: string | undefined;
  perspectiveId: string;
  newHeadId: string;
}

export interface Proposal {
  timestamp: number;
  creatorId: string;
  requests: Array<UpdateRequest>;
}

export interface PerspectiveData {
  id: string;
  perspective: Perspective;
  details: PerspectiveDetails;
  canWrite: Boolean;
  permissions: any;
}

export interface ProposalCreatedDetail {
  proposalId: string
}

export class ProposalCreatedEvent extends CustomEvent<ProposalCreatedDetail> {
  constructor(eventInitDict?: CustomEventInit<ProposalCreatedDetail>) {
    super('evees-proposal-created', eventInitDict);
  }
}
