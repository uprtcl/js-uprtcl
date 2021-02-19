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
        return remote.searchEngine
          ? remote.proposals
            ? remote.proposals.getProposalsToPerspective(perspectiveId)
            : []
          : [];
      })
    );
    return Array.prototype.concat.apply([], all);
  }
  getProposal(proposalId: string): Promise<Proposal> {
    throw new Error('Method not implemented.');
  }
  canPropose(perspectiveId?: string, userId?: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  canDelete(proposalId: string, userId?: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
