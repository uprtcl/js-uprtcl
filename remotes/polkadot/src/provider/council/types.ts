import { EveesMutation, Update } from '@uprtcl/evees';
import { ProposalConfig, ProposalStatus, VoteValue } from './proposal.config.types';

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
  fromPerspectiveId?: string;
  creatorId?: string;
  toHeadId?: string;
  fromHeadId?: string;
  mutation: EveesMutation;
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
  mutation: EveesMutation; // not indexed
  status: ProposalStatus; // not indexed
  endBlock: number; // not indexed, for sorting
}

export interface LocalPerspective {
  id: string;
  context: string;
  headId?: string;
}

export interface LocalVote {
  id: string;
  proposalId: string;
  member: string;
  value: VoteValue;
}

export interface ProposalSummary {
  status: ProposalStatus;
  votes: Vote[];
  block: number;
}
