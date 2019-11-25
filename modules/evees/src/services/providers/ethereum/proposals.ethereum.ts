import { Hashed } from '@uprtcl/cortex';
import { EthereumProvider, IpfsSource } from '@uprtcl/connections';

import { ProposalsProvider } from '../../proposals.provider';
import { Proposal, UpdateRequest } from '../../../types';

// Cesar: implement calls in this class

export class ProposalsEthereum implements ProposalsProvider {
  constructor(protected ethProvider: EthereumProvider, protected ipfsSource: IpfsSource) {}

  get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.ipfsSource.get(hash);
  }
  async ready(): Promise<void> {
    await Promise.all([this.ethProvider.ready(), this.ipfsSource.ready()]);
  }

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
}
