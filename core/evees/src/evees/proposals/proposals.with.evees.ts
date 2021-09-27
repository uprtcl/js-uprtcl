import { Evees } from '../evees.service';
import { ClientRemote } from '../interfaces/client.remote';
import { Proposals } from './proposals';
import { Proposal } from './types';

/** A class that implements the Proposals interface and runs on top
 * of Client */
export class ProposalsWithEvees implements Proposals {
  remote!: ClientRemote;

  constructor(readonly evees: Evees, readonly remoteId?: string) {
    this.remote = this.evees.getRemote(this.remoteId);
  }

  async createProposal(newProposal: Proposal) {
    const proposalConcept = await this.remote.snapPerspective({
      remote: '',
      path: '',
      timestamp: 0,
      creatorId: '',
      context: 'uprtcl.proposal',
    });
    // append the link
    (newProposal as any).meta.links = [proposalConcept.hash];

    // add it as child of the user proposals space
    const proposalsSpaceId = await this.getOrCreateProposalsSpace();
    const childId = this.evees.addNewChild(proposalsSpaceId, newProposal);
    return childId;
  }

  async getProposalsToPerspective() {
    return [];
  }

  async getOrCreateProposalsSpace(): Promise<string> {
    const home = await this.evees.getHome(this.remoteId);
    const homeData = await this.evees.getOrCreatePerspectiveData(home.hash);

    if (!homeData.object.proposals) {
      const proposalsSpaceId = await this.evees.createEvee({
        guardianId: home.hash,
        object: { proposals: [] },
      });
      const newHomeObject = {
        ...homeData.object,
        proposals: proposalsSpaceId,
      };
      this.evees.updatePerspectiveData({ perspectiveId: home.hash, object: newHomeObject });
      return proposalsSpaceId;
    } else {
      return homeData.object.proposals;
    }
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    const data = await this.evees.getPerspectiveData<Proposal>(proposalId);
    return data.object;
  }
  async canPropose(perspectiveId?: string, userId?: string): Promise<boolean> {
    return true;
  }
  async canDelete(proposalId: string, userId?: string): Promise<boolean> {
    return false;
  }
}
