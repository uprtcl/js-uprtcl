import { Logger } from '@uprtcl/micro-orchestrator';

import { ProposalsProvider } from '@uprtcl/evees';
import { UpdateRequest, Proposal, NewProposal, NewPerspectiveData } from '@uprtcl/evees';
import { OrbitDBConnection } from './orbit-db.connection';
import { CASStore } from '@uprtcl/multiplatform';

export interface ProposalManifest {
  toPerspectiveId: string;
  fromPerspectiveId: string;
  timestamp: number;
  owners: string[];
}

export interface ProposalDetails {
  updates: UpdateRequest[];
  newPerspectives: NewPerspectiveData[];
}

const defaultDetails: ProposalDetails = {
  updates: [],
  newPerspectives: []
};

export class ProposalsOrbitDB implements ProposalsProvider {
  logger = new Logger('PROPOSALS-ORBITDB');

  constructor(protected connection: OrbitDBConnection, protected store: CASStore) {}

  async ready(): Promise<void> {
    await Promise.all([this.connection.ready()]);
  }

  async createProposal(proposal: NewProposal): Promise<string> {
    await this.ready();

    this.logger.info('createProposal()', { proposal });
    const proposalManifest: ProposalManifest = {
      fromPerspectiveId: proposal.fromPerspectiveId,
      toPerspectiveId: proposal.toPerspectiveId,
      owners: [this.connection.identity.id],
      timestamp: Date.now()
    };

    /** Derive a proposal id from the proposal manifest */
    const proposalId = await this.store.create(proposalManifest);

    await this.updateProposalInternal(
      proposalId,
      {
        newPerspectives: [],
        updates: proposal.updates
      },
      true
    );

    const proposalsStore = await this.connection.proposalsToPerspectiveStore(
      proposal.toPerspectiveId,
      true
    );

    await proposalsStore.add(proposalId);

    return proposalId;
  }

  async getProposalStore(proposalId: string, pin: boolean = false) {
    const proposalManifest = (await this.store.get(proposalId)) as ProposalManifest;
    return this.connection.proposalStore(proposalManifest, false);
  }

  async getProposalDetails(proposalId): Promise<ProposalDetails> {
    const proposalStore = await this.getProposalStore(proposalId);
    const [latestEntry] = proposalStore.iterator({ limit: 1 }).collect();

    const output = latestEntry ? latestEntry.payload.value : defaultDetails;
    return { ...output };
  }

  async updateProposal(proposalId: string, details: ProposalDetails): Promise<void> {
    return this.updateProposalInternal(proposalId, details);
  }

  private async updateProposalInternal(
    proposalId: string,
    details: ProposalDetails,
    pin: boolean = false
  ): Promise<void> {
    this.logger.log('updateProposalInternal', { proposalId, details });

    const proposalStore = await this.getProposalStore(proposalId, pin);
    await proposalStore.add(details);

    this.logger.log('updateProposalInternal - done', { proposalId, details });
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    await this.ready();

    this.logger.info('getProposal() - pre', { proposalId });

    const proposalManifest = (await this.store.get(proposalId)) as ProposalManifest;
    const proposalDetails = await this.getProposalDetails(proposalId);

    const proposal: Proposal = {
      id: proposalId,
      creatorId: '',
      toPerspectiveId: proposalManifest.toPerspectiveId,
      fromPerspectiveId: proposalManifest.fromPerspectiveId,
      updates: proposalDetails.updates
    };

    this.logger.info('getProposal() - post', { proposal });

    return proposal;
  }

  async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
    await this.ready();

    this.logger.info('getProposalsToPerspective() - pre', { perspectiveId });

    const proposalsStore = await this.connection.proposalsToPerspectiveStore(perspectiveId);

    const proposalIds = [...proposalsStore.values()];
    this.logger.info('getProposalsToPerspective() - post', { proposalIds });

    return proposalIds;
  }
}
