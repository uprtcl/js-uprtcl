import { Source } from '@uprtcl/multiplatform';

export type RemoteMap = (eveesAuthority: string, entityName: string) => Source;

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
}

export interface CreateProposalDetail {
  toPerspective: PerspectiveData;
}

export class CreateProposalEvent extends CustomEvent<CreateProposalDetail> {
  constructor(eventInitDict?: CustomEventInit<CreateProposalDetail>) {
    super('evees-create-proposal', eventInitDict);
  }
}
