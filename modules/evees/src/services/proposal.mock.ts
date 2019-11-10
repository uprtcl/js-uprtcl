import { Hashed } from '@uprtcl/cortex';

import { ProposalProvider } from './proposal.provider';
import { Proposal, UpdateRequest } from '../types';

export class ProposalMock implements ProposalProvider {
  getProposalsByCreator(creatorId: string): Promise<Hashed<Proposal>[]> {
    throw new Error('Method not implemented.');
  }
  getProposalsToPerspective(perspectiveId: string): Promise<Hashed<Proposal>[]> {
    throw new Error('Method not implemented.');
  }
  createProposal(requests: UpdateRequest[], description: string | undefined): Promise<string> {
    throw new Error('Method not implemented.');
  }
  updateProposal(
    proposalId: string,
    requests: UpdateRequest[],
    description: string | undefined
  ): Promise<void> {
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
