import { Proposal, UpdateRequest } from '../types';

export interface ProposalsProvider {
  /** Getters */

  getProposalsToPerspective(perspectiveId: string): Promise<Array<Proposal>>;

  /** Modifiers */

  // From the point of view of the proposing person

  createProposal(
    fromPerspectiveId: string,
    toPerspectiveId: string,
    requests: UpdateRequest[]
  ): Promise<string>;

  updateProposal(proposalId: string, requests: UpdateRequest[]): Promise<void>;

  cancelProposal(proposalId: string): Promise<void>;

  // From the point of view of the person that is proposed

  declineUpdateRequests(updateRequestIds: string[]): Promise<void>;

  acceptUpdateRequests(updateRequestIds: string[]): Promise<void>;
}
