import { Proposal } from '../../proposals';

import {
  ProposalStatus,
  ProposalVotingDetails,
  Vote,
  VotedProposals,
} from '../../proposals/voted.proposals';
import { ProposalsStoreDB } from './proposals.store.local.db';

export class VotedProposalsLocal implements VotedProposals {
  db: ProposalsStoreDB;

  constructor() {
    this.db = new ProposalsStoreDB();
  }

  async canVote(proposalId: string, userId: string): Promise<boolean> {
    return true;
  }

  async vote(vote: Vote): Promise<void> {
    await this.db.votes.put(vote);
  }

  async getDetails(proposalId: string): Promise<ProposalVotingDetails> {
    const votes = await this.db.votes.where('proposalId').equals(proposalId).toArray();
    return {
      closeTime: 0,
      status: ProposalStatus.open,
      totalVotes: votes.length,
      totalApprove: votes.filter((v) => v.value === 'yes').length,
    };
  }

  createProposal(newProposal: Proposal): Promise<string> {
    throw new Error('Method not implemented.');
  }

  getProposal(proposalId: string): Promise<Proposal> {
    throw new Error('Method not implemented.');
  }

  getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  canPropose(proposalId: string, userId?: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  canDelete(proposalId: string, userId?: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
