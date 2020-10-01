import { ProposalDetails, ProposalsProvider } from '@uprtcl/evees';
import { Proposal, NewProposal } from '@uprtcl/evees/src/types';
import { HttpProvider } from '@uprtcl/http-provider';
import { EveesHttp } from './evees.http';

const uprtcl_api: string = 'uprtcl-ac-v1';
export class ProposalsHttp implements ProposalsProvider {
  constructor(protected provider: HttpProvider, protected evees: EveesHttp) {}

  canPropose() {
    return true;
  }

  async createProposal(proposal: NewProposal): Promise<string> {
    const result = await this.provider.post(`/proposal`, proposal);
    return result.elementIds[0];
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    return this.provider.getObject<Proposal>(`/proposal/${proposalId}`);
  }

  async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
    return this.provider.getObject<string[]>(`/persp/${perspectiveId}/proposals`);
  }

  updateProposal(proposalId: string, details: ProposalDetails): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
