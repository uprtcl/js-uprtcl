import { UpdateRequest } from '@uprtcl/evees';
import { ProposalConfig, VoteValue } from './proposal.config.types';

export interface Vote {
  proposalId: string;
  value: VoteValue;
}

export interface CouncilData {
  proposals?: DexieProposal[];
  votes?: Vote[];
}

export interface ProposalManifest {
  toPerspectiveId: string;
  fromPerspectiveId: string;
  creatorId?: string;
  toHeadId?: string;
  fromHeadId?: string;
  updates: UpdateRequest[];
  block: number;
  config: ProposalConfig;
}

export interface DexieProposal {
  id: string;
  toPerspectiveId: string;
  updatedPerspectives: string[]; // for indexing
  blockEnd?: number;
  updates: UpdateRequest[]; // not indexed
  status?: ProposalStatusCache;
}

export interface ProposalStatusCache {
  status: any;
  votes: { member: string; value: VoteValue }[];
}
