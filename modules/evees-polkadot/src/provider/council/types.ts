import { UpdateRequest } from '@uprtcl/evees';
import { ProposalConfig, VoteValue } from './proposal.config.types';

export interface Vote {
  proposalId: string;
  member: string;
  value: VoteValue;
}

export interface CouncilData {
  proposals?: CouncilProposal[];
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

/* Council proposals are stored inside CouncilData 
   Proposals are like "blocks", you only need
   their hash, and a "mined" flag (blockEnd) in
   this case to consider that proposal valid. */
export interface CouncilProposal {
  id: string;
  blockEnd?: number;
}

/* LocalProposal proposals are stored on local storage,
   they include further details about a proposal
   that are not in the proposal manifest, and properties 
   for indexing and filtering */
export interface LocalProposal {
  id: string;
  toPerspectiveId: string;
  updatedPerspectives: string[]; // for indexing
  blockEnd?: number;
  updates: UpdateRequest[]; // not indexed
  status?: ProposalStatusCache;
}

export interface ProposalStatusCache {
  status: any;
  votes: Vote[];
}
