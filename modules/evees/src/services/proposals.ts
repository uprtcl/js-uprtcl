import { Entity } from '@uprtcl/cortex';
import { Lens } from '@uprtcl/lenses';

import { Proposal } from '../types';
export interface Proposals {
  createProposal(newProposal: Proposal);

  getProposal(proposalId: string): Promise<Entity<Proposal>>;

  getProposalsToPerspective(perspectiveId: string): Promise<string[]>;

  canPropose(perspectiveId?: string, userId?: string): Promise<boolean>;

  canDelete(proposalId: string, userId?: string): Promise<boolean>;

  /** UI interaction */
  lense?(): Lens;
}
