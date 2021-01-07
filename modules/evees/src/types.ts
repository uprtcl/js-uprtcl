import { TemplateResult } from 'lit-element';
import { Behaviour } from '@uprtcl/cortex';

import { EveesRemote } from './services/remote.evees';
import { Secured } from './utils/cid-hash';
import { Client, EveesMutation } from './services/client';

export interface Perspective {
  remote: string;
  path: string;
  creatorId: string;
  context: string;
  timestamp: number;
  fromPerspectiveId?: string; // optional parameters to hardcode
  fromHeadId?: string; // forks on the perspective id
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
  id: string;
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
  mutation: EveesMutation;
}

export const PROPOSAL_CREATED_TAG: string = 'evees-proposal';

export class ProposalCreatedEvent extends CustomEvent<ProposalCreatedDetail> {
  constructor(eventInitDict?: CustomEventInit<ProposalCreatedDetail>) {
    super(PROPOSAL_CREATED_TAG, eventInitDict);
  }
}

export interface NewPerspectiveData {
  perspective: Secured<Perspective>;
  details: PerspectiveDetails;
  parentId?: string;
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
  defaultRemote?: EveesRemote;
  officialRemote?: EveesRemote;
  editableRemotesIds?: string[];
  emitIf?: {
    remote: string;
    owner: string;
  };
}
