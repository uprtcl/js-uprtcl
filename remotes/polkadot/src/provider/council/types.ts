import { EveesMutation, EveesMutationCreate } from '@uprtcl/evees';
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
  remote: string; // stores the remote as part of the  proposalId
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
  mutation: EveesMutationCreate; // not indexed
  status: ProposalStatus; // not indexed
  endBlock: number; // not indexed, for sorting
}

export interface LocalHeadUpdate {
  block: number;
  headId?: string;
}
export interface LocalPerspective {
  id: string;
  context: string;
  headUpdates: LocalHeadUpdate[];
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
