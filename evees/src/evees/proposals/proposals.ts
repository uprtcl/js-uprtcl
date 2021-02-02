import { Lens } from '../../patterns/behaviours/has-lenses';

import { Proposal } from './types';
export interface Proposals {
  createProposal(newProposal: Proposal);

  getProposal(proposalId: string): Promise<Proposal>;

  getProposalsToPerspective(perspectiveId: string): Promise<string[]>;

  canPropose(perspectiveId?: string, userId?: string): Promise<boolean>;

  canDelete(proposalId: string, userId?: string): Promise<boolean>;

  /** UI interaction */
  lense?(): Lens;
}
