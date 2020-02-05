import { UpdateRequest, Proposal } from '../types';

export interface ProposalsProvider {
  /** Getters */

  getProposal(proposalId: string): Promise<Proposal>;

  getProposalsToPerspective(perspectiveId: string): Promise<string[]>;

  /** Modifiers */

  // From the point of view of the proposing person

  createProposal(
    fromPerspectiveId: string,
    toPerspectiveId: string,
    updates: UpdateRequest[]
  ): Promise<string>;

  addUpdatesToProposal(proposalId: string, updates: UpdateRequest[]): Promise<void>;
  
  freezeProposal(proposalId: string, updates: UpdateRequest[]): Promise<void>;
  
  cancelProposal(proposalId: string): Promise<void>;

  // From the point of view of the person that is proposed

  declineProposal(proposalId: string[]): Promise<void>;

  acceptProposal(proposalId: string[]): Promise<void>;

  executeProposal(proposalId: string[]): Promise<void>;
}
