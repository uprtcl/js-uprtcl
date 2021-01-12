import { Entity } from 'src/evees/elements/node_modules/src/evees/patterns/node_modules/src/evees/merge/node_modules/src/evees/behaviours/node_modules/@uprtcl/cortex';
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
