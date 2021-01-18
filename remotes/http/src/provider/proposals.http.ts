import { Proposal, Proposals } from '@uprtcl/evees';
import { HttpProvider } from '@uprtcl/http-provider';

import { EveesHttp } from './evees.http';

const uprtcl_api: string = 'uprtcl-ac-v1';
export class ProposalsHttp implements Proposals {
  constructor(protected provider: HttpProvider, protected evees: EveesHttp) {}

  async canPropose() {
    return true;
  }

  async canDelete(proposalId: string, userId?: string): Promise<boolean> {
    return false;
  }

  async canRemove() {
    return false;
  }

  async createProposal(proposal: Proposal): Promise<string> {
    const result = await this.provider.post(`/proposal`, proposal);
    return result.elementIds[0];
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    const proposal = await this.provider.getObject<Proposal>(`/proposal/${proposalId}`);
    /** inject the casID of the remote store */
    proposal.mutation.newPerspectives = proposal.mutation.newPerspectives.map((newPerspective) => {
      return {
        ...newPerspective,
        perspective: {
          ...newPerspective.perspective,
          casID: this.evees.store.casID,
        },
      };
    });

    return proposal;
  }

  async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
    return this.provider.getObject<string[]>(`/persp/${perspectiveId}/proposals`);
  }

  updateProposal(proposalId: string, details: Proposal): Promise<void> {
    throw new Error('Method not implemented.');
  }

  deleteProposal(proposalId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
