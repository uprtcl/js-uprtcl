import { ProposalsProvider } from '../../proposals.provider';
import {
    UpdateRequest,
    Proposal,
    NewProposal,
    NewPerspectiveData,
  } from '../../../types';
import { HttpProvider, HttpConnection } from '@uprtcl/http-provider';
import { EveesHttp } from './evees.http';

const uprtcl_api: string = 'uprtcl-ac-v1';
export class ProposalsHttp extends HttpProvider implements ProposalsProvider {
    
    constructor(host: string, protected connection: HttpConnection, protected evees: EveesHttp) {
        super(
            {
                host: host,
                apiId: uprtcl_api
            },
            connection              
        )        
    }
    
    async createProposal(proposal: NewProposal): Promise<string> {
        const result = await  super.httpPost(`/proposal`, proposal);
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
        return super.getObject<Proposal>(`/proposal/${proposalId}`);        
    }

    async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
        return super.getObject<string[]>(`/persp/${perspectiveId}/proposals`);                
    }

    async addUpdatesToProposal(proposalId: string, updates: UpdateRequest[]): Promise<void> {
        super.httpPut(`/proposal/${proposalId}`, updates);
    }

    freezeProposal(proposalId: string, updates: any[]): Promise<void> {
        throw new Error('Method not implemented.');
    }

    cancelProposal(proposalId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async declineProposal(proposalId: string[]): Promise<void> {
        super.httpPut(`/proposal/${proposalId}/decline`, {});
    }

    async acceptProposal(proposalId: string[]): Promise<void> {

    }
    
    async executeProposal(proposalId: string[]): Promise<void> {

    }

}