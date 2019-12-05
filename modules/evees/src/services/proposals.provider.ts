import { Source, Hashed } from '@uprtcl/cortex';

import { Proposal, UpdateRequest } from '../types';

export interface ProposalsProvider extends Source {
  /** Getters */

  getProposalsToPerspective(perspectiveId: string): Promise<Array<Proposal>>;

  /** Modifiers */

  // From the point of view of the proposing person

  createProposal(requests: UpdateRequest[]): Promise<string>;

  updateProposal(
    proposalId: string,
    requests: UpdateRequest[]
  ): Promise<void>;

  cancelProposal(proposalId: string): Promise<void>;

  // From the point of view of the person that is proposed

  declineUpdateRequests(updateRequestIds: string[]): Promise<void>;

  acceptUpdateRequests(updateRequestIds: string[]): Promise<void>;
}
