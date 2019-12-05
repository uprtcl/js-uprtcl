import { Hashed } from '@uprtcl/cortex';

import { ProposalsProvider } from './proposals.provider';
import { Proposal, UpdateRequest } from '../types';

export class ProposalsMock implements ProposalsProvider {
  getProposalsToPerspective(perspectiveId: string): Promise<Proposal[]> {
    throw new Error('Method not implemented.');
  }
  createProposal(requests: UpdateRequest[]): Promise<string> {
    throw new Error('Method not implemented.');
  }
  updateProposal(proposalId: string, requests: UpdateRequest[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  cancelProposal(proposalId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  declineUpdateRequests(updateRequestIds: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  acceptUpdateRequests(updateRequestIds: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    throw new Error('Method not implemented.');
  }
  ready(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
