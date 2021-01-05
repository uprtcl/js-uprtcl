import { Lens } from '@uprtcl/lenses';
import { Proposal, NewProposal, ProposalDetails } from '../types';

export interface Proposals {
  /** Getters */
  getProposal(proposalId: string): Promise<Proposal>;

  /** Modifiers */
  createProposal(proposal: NewProposal): Promise<string>;

  updateProposal(proposalId: string, details: ProposalDetails): Promise<void>;

  deleteProposal(proposalId: string): Promise<void>;

  /** UI interaction */
  lense?(): Lens;

  canPropose(perspectiveId?: string, userId?: string): Promise<boolean>;

  canDelete(proposalId: string, userId?: string): Promise<boolean>;
}
