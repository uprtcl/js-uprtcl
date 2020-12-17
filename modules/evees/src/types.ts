import { TemplateResult } from 'lit-element';
import { Behaviour } from '@uprtcl/cortex';

import { EveesRemote } from './services/evees.remote';
import { Secured } from './utils/cid-hash';

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
}
export interface Commit {
  creatorsIds: string[];
  timestamp: number;
  message?: string;
  forking?: string;
  parentsIds: Array<string>;
  dataId: string;
}

export const getAuthority = (perspective: Perspective): string => {
  return `${perspective.remote}:${perspective.path}`;
};

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
  remote: string;
  proposalDetails: ProposalDetails;
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

export interface EveesConfig {
  defaultRemote?: EveesRemote;
  officialRemote?: EveesRemote;
  editableRemotesIds?: string[];
  emitIf?: {
    remote: string;
    owner: string;
  };
}
