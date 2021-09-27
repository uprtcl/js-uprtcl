import { html } from 'lit-html';

import {
  Logger,
  Proposal,
  ProposalEvents,
  MutationHelper,
  EntityResolver,
  EntityRemoteBuffered,
} from '@uprtcl/evees';
import { Lens, ProposalsWithUI } from '@uprtcl/evees-ui';

import { PolkadotConnection } from '../../connection.polkadot';

import { ProposalConfig, VoteValue } from './proposal.config.types';
import { CouncilStoreEvents, PolkadotCouncilEveesStorage } from './evees.council.store';
import { ProposalManifest } from './types';
import EventEmitter from 'events';

export class ProposalsPolkadotCouncil implements ProposalsWithUI {
  logger = new Logger('PROPOSALS-POLKADOT-COUNCIL');

  events: EventEmitter;

  private canProposeCache = false;

  constructor(
    public connection: PolkadotConnection,
    public councilStore: PolkadotCouncilEveesStorage,
    public entityResolver: EntityResolver,
    public entityRemote: EntityRemoteBuffered,
    public remoteId: string,
    public config: ProposalConfig
  ) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(1000);

    if (this.councilStore.events) {
      this.councilStore.events.on(CouncilStoreEvents.proposalStatusChanged, (proposalStatus) => {
        this.logger.log('Proposal Status Changed', proposalStatus);
        this.events.emit(ProposalEvents.status_changed, proposalStatus);
      });
    }
  }

  async init(): Promise<void> {
    if (!this.connection.account) throw new Error('Polkadot connection not ready');

    const council = await this.connection.getCouncil();
    this.canProposeCache = council.includes(this.connection.account);
    await this.councilStore.init();
  }

  async canPropose() {
    return this.canProposeCache;
  }

  async canDelete(proposalId: string, userId?: string): Promise<boolean> {
    return false;
  }

  async createProposal(proposal: Proposal): Promise<string> {
    this.logger.info('createProposal()', { proposal });

    const proposalManifest: ProposalManifest = {
      remote: this.remoteId,
      fromPerspectiveId: proposal.fromPerspectiveId,
      toPerspectiveId: proposal.toPerspectiveId,
      creatorId: this.connection.account,
      fromHeadId: proposal.fromHeadId,
      toHeadId: proposal.toHeadId,
      mutation: proposal.mutation,
      block: await this.connection.getLatestBlock(),
      config: this.config,
    };

    /** persist entities associated to this mutation */
    if (proposal.mutation) {
      const hashes = await MutationHelper.getMutationEntitiesHashes(
        proposal.mutation,
        this.entityResolver
      );
      const entities = await this.entityResolver.getEntities(hashes);
      await this.entityRemote.putEntities(entities);
      await this.entityRemote.flush();
    }

    const proposalId = await this.councilStore.createProposal(proposalManifest);

    this.logger.info('createProposal() - done', {
      proposalId,
      proposalManifest,
    });

    this.events.emit(ProposalEvents.created, [proposalId]);

    return proposalId;
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    this.logger.info('getProposal() - pre', { proposalId });

    const proposalManifest = await this.councilStore.getProposalManifest(proposalId);

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
    return this.councilStore.getProposalsToPerspective(perspectiveId);
  }

  async getProposalSummary(proposalId: string) {
    return this.councilStore.getProposalSummary(proposalId);
  }

  async vote(proposalId: string, vote: VoteValue) {
    return this.councilStore.vote(proposalId, vote);
  }

  lense(): Lens {
    return {
      name: 'evees-polkadot:proposal',
      type: 'proposal',
      render: (entity: any) => {
        return html`
          <evees-polkadot-council-proposal proposal-id=${entity.proposalId}>
          </evees-polkadot-council-proposal>
        `;
      },
    };
  }
}
