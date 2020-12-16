import { html } from 'lit-element';

import { Logger } from '@uprtcl/micro-orchestrator';
import { ProposalsProvider, UpdateRequest } from '@uprtcl/evees';
import { ProposalDetails, Proposal, NewProposal } from '@uprtcl/evees';
import { CASStore } from '@uprtcl/multiplatform';
import { Lens } from '@uprtcl/lenses';

import { PolkadotCouncilEveesStorage } from './evees.council.store';
import { ProposalManifest } from './types';
import { PolkadotConnection } from '../../connection.polkadot';
import { ProposalConfig, VoteValue } from './proposal.config.types';

export class ProposalsPolkadotCouncil implements ProposalsProvider {
  logger = new Logger('PROPOSALS-POLKADOT-COUNCIL');
  private canProposeCache: boolean = false;

  constructor(
    public connection: PolkadotConnection,
    public councilStore: PolkadotCouncilEveesStorage,
    public store: CASStore,
    public config: ProposalConfig
  ) {}

  async ready(): Promise<void> {
    await this.init();
    await this.councilStore.ready();
  }

  async init() {
    if (!this.connection.account) return false;
    const council = await this.connection.getCouncil();
    this.canProposeCache = council.includes(this.connection.account);
  }

  async canPropose() {
    return this.canProposeCache;
  }

  async canRemove(proposalId: string, userId?: string) {
    return false;
  }

  async createProposal(proposal: NewProposal): Promise<string> {
    await this.ready();
    this.logger.info('createProposal()', { proposal });

    const updates = proposal.details.newPerspectives
      .map(
        (newPerspective): UpdateRequest => {
          if (newPerspective.details.headId === undefined)
            throw new Error('headId cannot be undefiend for newPerspectives');
          return {
            newHeadId: newPerspective.details.headId,
            perspectiveId: newPerspective.perspective.id
          };
        }
      )
      .concat(proposal.details.updates);

    const proposalManifest: ProposalManifest = {
      fromPerspectiveId: proposal.fromPerspectiveId,
      toPerspectiveId: proposal.toPerspectiveId,
      block: await this.connection.getLatestBlock(),
      config: this.config,
      updates: updates,
      creatorId: this.connection.account,
      fromHeadId: proposal.fromHeadId,
      toHeadId: proposal.toHeadId
    };

    const proposalId = await this.councilStore.createProposal(proposalManifest);

    this.logger.info('createProposal() - done', {
      proposalId,
      proposalManifest,
      details: proposal.details
    });

    return proposalId;
  }

  async updateProposal(proposalId: string, details: ProposalDetails): Promise<void> {
    throw new Error('method not valid');
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    await this.ready();

    this.logger.info('getProposal() - pre', { proposalId });

    const proposalManifest = (await this.store.get(proposalId)) as ProposalManifest;

    // const newPerspectives = proposalManifest.updates.filter(update => update.fromPerspectiveId === undefined).map(update => {
    //   perspect
    // })

    const proposal: Proposal = {
      id: proposalId,
      creatorId: '',
      toPerspectiveId: proposalManifest.toPerspectiveId,
      fromPerspectiveId: proposalManifest.fromPerspectiveId,
      details: {
        newPerspectives: [],
        updates: proposalManifest.updates.filter(update => update.fromPerspectiveId !== undefined)
      }
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

  lense(): Lens {
    return {
      name: 'evees-polkadot:proposal',
      type: 'proposal',
      render: (entity: any) => {
        return html`
          <evees-polkadot-council-proposal proposal-id=${entity.proposalId}>
          </evees-polkadot-council-proposal>
        `;
      }
    };
  }

  async getProposalSummary(proposalId: string) {
    return this.councilStore.getProposalSummary(proposalId);
  }

  async vote(proposalId: string, vote: VoteValue) {
    return this.councilStore.vote(proposalId, vote);
  }
}
