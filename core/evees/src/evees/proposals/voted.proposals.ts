import { ClientRemote } from '../interfaces/client.remote';
import { Proposals } from './proposals';

/** a proposal can be open (in which case voters can vote) or closed, in which case it was either approved or rejected. */
export enum ProposalStatus {
  open = 'open',
  closedApproved = 'closedApproved',
  closedRejected = 'closedRejected',
}

/** A "vote" includes the proposalId, the id of the voter and the value (yes or no) */
export interface Vote {
  proposalId: string;
  voter: string;
  value: 'yes' | 'no';
}

export interface ProposalVotingDetails {
  totalVotes: number;
  totalApprove: number;
  status: ProposalStatus;
  closeTime: number;
}

export interface VotedProposals extends Proposals {
  canVote(proposalId: string, userId: string): Promise<boolean>;
  vote(vote: Vote): Promise<void>;
  getDetails(proposalId: string): Promise<ProposalVotingDetails | undefined>;
}
