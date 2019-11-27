import { Source, Hashed } from '@uprtcl/cortex';

import { Proposal, UpdateRequest } from '../types';

export interface ProposalsProvider extends Source {
  /** Getters */

  getProposalsByCreator(creatorId: string): Promise<Hashed<Proposal>[]>;

  getProposalsToPerspective(perspectiveId: string): Promise<Hashed<Proposal>[]>;

  /** Modifiers */

  // From the point of view of the proposing person

  createProposal(requests: UpdateRequest[], description: string | undefined): Promise<string>;

  updateProposal(
    proposalId: string,
    requests: UpdateRequest[],
    description: string | undefined
  ): Promise<void>;

  cancelProposal(proposalId: string): Promise<void>;

  // From the point of view of the person that is proposed

  declineUpdateRequests(updateRequestIds: string[]): Promise<void>;

  acceptUpdateRequests(updateRequestIds: string[]): Promise<void>;
}
