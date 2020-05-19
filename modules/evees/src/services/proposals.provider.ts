import { UpdateRequest, Proposal, NewProposal, NewPerspectiveData } from '../types';

export interface ProposalsProvider {
  /** Getters */

  getProposal(proposalId: string): Promise<Proposal>;

  getProposalsToPerspective(perspectiveId: string): Promise<string[]>;

  /** Modifiers */

  // From the point of view of the proposing person

  createProposal(proposal: NewProposal): Promise<string>;

  createAndPropose(
    newPerspectivesData: NewPerspectiveData[],
    proposal: NewProposal
  ): Promise<string>;

  addUpdatesToProposal(proposalId: string, updates: UpdateRequest[]): Promise<void>;

  freezeProposal(proposalId: string, updates: UpdateRequest[]): Promise<void>;

  cancelProposal(proposalId: string): Promise<void>;

  // From the point of view of the person that is proposed

  declineProposal(proposalId: string[]): Promise<void>;

  acceptProposal(proposalId: string[]): Promise<void>;

  executeProposal(proposalId: string[]): Promise<void>;
}
