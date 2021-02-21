import { Proposals } from '../proposals/proposals';
import { Proposal } from '../proposals/types';
import { BaseRouter } from './base.router';

/** create a proposal on each remote associated to a router */
export class ProposalsRouter extends BaseRouter implements Proposals {
  async createProposal(newProposal: Proposal): Promise<string> {
    const mutationPerRemote = await this.splitMutation(newProposal.mutation);

    /** at this point the mutation is split per remote and is sent to each remote */
    await Promise.all(
      Array.from(mutationPerRemote.keys()).map((remoteId) => {
        const mutation = mutationPerRemote.get(remoteId);
        const remote = this.getRemote(remoteId);

        if (!remote.proposals) throw new Error(`remote ${remoteId} don't have proposals`);
        if (!mutation) throw new Error(`mutation undefined`);

        return remote.proposals.createProposal({
          toPerspectiveId: newProposal.toPerspectiveId,
          mutation,
        });
      })
    );

    /** TODO proposalId is not unique */
    return '';
  }
  async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.proposals ? remote.proposals.getProposalsToPerspective(perspectiveId) : [];
      })
    );
    return Array.prototype.concat.apply([], all);
  }
  async getProposal(proposalId: string): Promise<Proposal> {
    const remote = await this.getPerspectiveRemote(proposalId);
    if (!remote.proposals) throw new Error('Proposals service not defined');
    return remote.proposals.getProposal(proposalId);
  }
  async canPropose(proposalId: string, userId?: string): Promise<boolean> {
    const remote = await this.getPerspectiveRemote(proposalId);
    if (!remote.proposals) throw new Error('Proposals service not defined');
    return remote.proposals.canPropose(proposalId, userId);
  }
  async canDelete(proposalId: string, userId?: string): Promise<boolean> {
    const remote = await this.getPerspectiveRemote(proposalId);
    if (!remote.proposals) throw new Error('Proposals service not defined');
    return remote.proposals.canDelete(proposalId, userId);
  }
}
