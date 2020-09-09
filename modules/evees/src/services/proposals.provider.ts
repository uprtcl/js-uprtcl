import { UpdateRequest, Proposal, NewProposal, NewPerspectiveData } from '../types';

export interface ProposalsProvider {
  /** Getters */

  getProposal(proposalId: string): Promise<Proposal>;

  getProposalsToPerspective(perspectiveId: string): Promise<string[]>;

  /** Modifiers */

  createProposal(proposal: NewProposal): Promise<string>;

  updateProposal(proposalId: string, updates: UpdateRequest[]): Promise<void>;
}
