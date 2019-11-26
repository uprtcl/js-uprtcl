import { Hashed } from '@uprtcl/cortex';
import { EthereumProvider, IpfsSource } from '@uprtcl/connections';

import { ProposalsProvider } from '../../proposals.provider';
import { Proposal, UpdateRequest, ProposalRequest } from '../../../types';

// Cesar: implement calls in this class

export class ProposalsEthereum implements ProposalsProvider {
  constructor(protected ethProvider: EthereumProvider, protected ipfsSource: IpfsSource) {}

  get<T extends object>(hash: string): Promise<Hashed<T> | undefined> {
    return this.ipfsSource.get(hash);
  }
  async ready(): Promise<void> {
    await Promise.all([this.ethProvider.ready(), this.ipfsSource.ready()]);
  }

  getProposalsToPerspective(perspectiveId: string): Promise<Array<ProposalRequest>> {
    throw new Error('Method not implemented.');
  }

  createProposal(requests: UpdateRequest[], description: string | undefined): Promise<string> {
    // 1. Create proposal interface, and add it to IPFS
    // 2. Add the requests already passed to IPFS
    // 3. Call the smart contract passing the proposal id and the UpdateRequests
    // 4. Return the propoosal id
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
