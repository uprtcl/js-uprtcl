import { Proposal } from './types';
export interface Proposals {
  createProposal(newProposal: Proposal): Promise<string>;

  getProposal(proposalId: string): Promise<Proposal>;

  canPropose(perspectiveId?: string, userId?: string): Promise<boolean>;

  canDelete(proposalId: string, userId?: string): Promise<boolean>;
}
