import { Proposal, Proposals } from '@uprtcl/evees';
import { HttpConnectionLogged } from '@uprtcl/http-provider';

export class ProposalsHttp implements Proposals {
  constructor(protected connection: HttpConnectionLogged) {}

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
    const result = await this.connection.post(`/proposal`, proposal);
    return result.elementIds[0];
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    const proposal = await this.connection.get<Proposal>(`/proposal/${proposalId}`);
    return proposal;
  }

  async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
    return this.connection.get<string[]>(`/persp/${perspectiveId}/proposals`);
  }

  updateProposal(proposalId: string, details: Proposal): Promise<void> {
    throw new Error('Method not implemented.');
  }

  deleteProposal(proposalId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
