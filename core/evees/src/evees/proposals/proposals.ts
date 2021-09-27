import { EventEmitter } from 'events';
import { Proposal } from './types';

export enum ProposalEvents {
  created = 'created',
  status_changed = 'status_changed',
}
export interface Proposals {
  events?: EventEmitter;

  createProposal(newProposal: Proposal): Promise<string>;

  getProposal(proposalId: string): Promise<Proposal>;

  getProposalsToPerspective(perspectiveId: string): Promise<string[]>;

  canPropose(proposalId: string, userId?: string): Promise<boolean>;

  canDelete(proposalId: string, userId?: string): Promise<boolean>;
}
