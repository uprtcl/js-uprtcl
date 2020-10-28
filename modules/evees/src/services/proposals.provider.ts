import { Lens } from '@uprtcl/lenses';
import { Proposal, NewProposal, ProposalDetails } from '../types';

export interface ProposalsProvider {
  /** Getters */
  getProposal(proposalId: string): Promise<Proposal>;

  getProposalsToPerspective(perspectiveId: string): Promise<string[]>;

  /** Modifiers */
  createProposal(proposal: NewProposal): Promise<string>;

  updateProposal(proposalId: string, details: ProposalDetails): Promise<void>;

  deleteProposal(proposalId: string): Promise<void>;

  /** UI interaction */
  lense?(): Lens;

  canPropose(perspectiveId?: string): Promise<Boolean>;

  canRemove(proposalId: string, userId?: string): Promise<Boolean>;
}
