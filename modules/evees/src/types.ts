import { Source } from '@uprtcl/multiplatform';
import { EveesRemote } from './services/evees.remote';
import { Secured } from './patterns/default-secured.pattern';

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
  fromPerspectiveId?: string | undefined;
  oldHeadId?: string | undefined;
  perspectiveId: string;
  newHeadId: string;
}

export interface Proposal {
  id: string;
  creatorId?: string,
  toPerspectiveId?: string;
  fromPerspectiveId: string;
  updates?: Array<UpdateRequest>;
  status?: boolean;
  authorized?: boolean;
  executed?: boolean;
  canAuthorize?: boolean;
}

export interface RequestCreatedDetail {
  requestId: string
}

export class RequestCreatedEvent extends CustomEvent<RequestCreatedDetail> {
  constructor(eventInitDict?: CustomEventInit<RequestCreatedDetail>) {
    super('evees-request-created', eventInitDict);
  }
}
