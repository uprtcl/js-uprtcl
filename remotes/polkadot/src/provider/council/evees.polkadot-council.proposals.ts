import { CASStore, Logger, NewPerspective, Proposal, Proposals } from '@uprtcl/evees';

import { PolkadotConnection } from '../../connection.polkadot';

import { ProposalConfig, VoteValue } from './proposal.config.types';
import { PolkadotCouncilEveesStorage } from './evees.council.store';
import { ProposalManifest } from './types';

export class ProposalsPolkadotCouncil implements Proposals {
  logger = new Logger('PROPOSALS-POLKADOT-COUNCIL');

  public store!: CASStore;

  private canProposeCache = false;

  constructor(
    public connection: PolkadotConnection,
    public councilStore: PolkadotCouncilEveesStorage,
    public config: ProposalConfig
  ) {}

  async ready(): Promise<void> {
    await this.init();
    await this.councilStore.ready();
  }

  setStore(store: CASStore) {
    this.store = store;
  }

  async init() {
    if (!this.connection.account) return false;
    const council = await this.connection.getCouncil();
    this.canProposeCache = council.includes(this.connection.account);
  }

  async canPropose() {
    return this.canProposeCache;
  }

  async canDelete(proposalId: string, userId?: string): Promise<boolean> {
    return false;
  }

  async createProposal(proposal: Proposal): Promise<string> {
    await this.ready();
    this.logger.info('createProposal()', { proposal });

    const proposalManifest: ProposalManifest = {
      fromPerspectiveId: proposal.fromPerspectiveId,
      toPerspectiveId: proposal.toPerspectiveId,
      creatorId: this.connection.account,
      fromHeadId: proposal.fromHeadId,
      toHeadId: proposal.toHeadId,
      mutation: proposal.mutation,
      block: await this.connection.getLatestBlock(),
      config: this.config,
    };

    const proposalId = await this.councilStore.createProposal(proposalManifest);

    this.logger.info('createProposal() - done', {
      proposalId,
      proposalManifest,
    });

    return proposalId;
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    await this.ready();

    this.logger.info('getProposal() - pre', { proposalId });

    const { object: proposalManifest } = await this.store.getEntity<ProposalManifest>(proposalId);

    // const newPerspectives = proposalManifest.updates.filter(update => update.fromPerspectiveId === undefined).map(update => {
    //   perspect
    // })

    const proposal: Proposal = {
      creatorId: '',
      toPerspectiveId: proposalManifest.toPerspectiveId,
      fromPerspectiveId: proposalManifest.fromPerspectiveId,
      mutation: proposalManifest.mutation,
    };

    this.logger.info('getProposal() - post', { proposal });

    return proposal;
  }

  deleteProposal(proposalId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
    await this.ready();
    return this.councilStore.getProposalsToPerspective(perspectiveId);
  }

  async getProposalSummary(proposalId: string) {
    return this.councilStore.getProposalSummary(proposalId);
  }

  async vote(proposalId: string, vote: VoteValue) {
    return this.councilStore.vote(proposalId, vote);
  }
}
