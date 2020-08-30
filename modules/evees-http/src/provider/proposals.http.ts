import { ProposalsProvider } from '@uprtcl/evees';
import {
    UpdateRequest,
    Proposal,
    NewProposal,
    NewPerspectiveData,
  } from '@uprtcl/evees/src/types';
import { HttpProvider } from '@uprtcl/http-provider';
import { EveesHttp } from './evees.http';

const uprtcl_api: string = 'uprtcl-ac-v1';
export class ProposalsHttp implements ProposalsProvider {

    constructor(protected provider: HttpProvider, protected evees: EveesHttp) {}

    async createProposal(proposal: NewProposal): Promise<string> {
        const result = await  this.provider.post(`/proposal`, proposal);
        return result.elementIds[0];
    }

    async createAndPropose(
        newPerspectiveData: NewPerspectiveData[],
        proposal: NewProposal
    ): Promise<string> {  
        await this.evees.createPerspectiveBatch(newPerspectiveData);             
        return await this.createProposal(proposal);        
    }

    async getProposal(proposalId: string): Promise<Proposal> {
        return this.provider.getObject<Proposal>(`/proposal/${proposalId}`);         
    }

    async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
        return this.provider.getObject<string[]>(`/persp/${perspectiveId}/proposals`);                
    }

    async addUpdatesToProposal(proposalId: string, updates: UpdateRequest[]): Promise<void> {
        this.provider.put(`/proposal/${proposalId}`, updates);
    }

    freezeProposal(proposalId: string, updates: any[]): Promise<void> {
        throw new Error('Method not implemented.');
    }

    cancelProposal(proposalId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async declineProposal(proposalId: string[]): Promise<void> {
        this.provider.put(`/proposal/${proposalId}/decline`, {});
    }

    async acceptProposal(proposalId: string[]): Promise<void> {
        this.provider.put(`/proposal/${proposalId}/accept`, {});
    }

    async executeProposal(proposalId: string[]): Promise<void> {
        throw new Error('Method not implemented.');
    }

}