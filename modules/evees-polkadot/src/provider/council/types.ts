import { Proposal, UpdateRequest } from '@uprtcl/evees';

export interface ProposalConfig {
  quorum: number;
  thresehold: number;
  duration: number;
}

export enum VoteValue {
  Undefined = 'UNDEFINED',
  Yes = 'YES',
  No = 'NO'
}

export interface Vote {
  proposalId: string;
  value: VoteValue;
}

export interface CouncilData {
  proposals: Proposal[];
}

export interface DexieProposal {
  id: string;
  toPerspectiveId: string;
  updatedPerspectives: string[]; // for indexing
  blockStart: number;
  blockEnd: number;
  updates: UpdateRequest[]; // not indexed
  verified: boolean; // not indexed
}

export interface CouncilMember {
  block: number;
  member: string;
}
