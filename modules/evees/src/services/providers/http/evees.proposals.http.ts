import { ProposalsProvider } from '../../proposals.provider';
import {
    UpdateRequest,
    Proposal,
    NewProposal,
    NewPerspectiveData,
  } from '../../../types';
import { HttpProvider, HttpConnection } from '@uprtcl/http-provider';

const uprtcl_api: string = 'uprtcl-ac-v1';
export class ProposalsHttp extends HttpProvider implements ProposalsProvider {
    
    constructor(host: string, protected connection: HttpConnection) {
        super(
            {
                host: host,
                apiId: uprtcl_api
            },
            connection
        )
    }
    
    async createProposal(proposal: NewProposal): Promise<string> {
        return '';
    }

    async createAndPropose(
        newPerspectiveData: NewPerspectiveData[],
        proposal: NewProposal
    ): Promise<string> {
        return '';
    }

    async getProposal(proposalId: string): Promise<Proposal> {
        const mockProp: Proposal = {
            id: '',
            fromPerspectiveId: ''
        };
        return mockProp;
    }

    async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
        return [''];
    }

    async addUpdatesToProposal(proposalId: string, updates: UpdateRequest[]): Promise<void> {

    }

    freezeProposal(proposalId: string, updates: any[]): Promise<void> {
        throw new Error('Method not implemented.');
    }

    cancelProposal(proposalId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async declineProposal(proposalId: string[]): Promise<void> {
        
    }

    async acceptProposal(proposalId: string[]): Promise<void> {

    }
    
    async executeProposal(proposalId: string[]): Promise<void> {

    }

}