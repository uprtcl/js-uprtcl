import { Logger } from '@uprtcl/micro-orchestrator';
import { html } from 'lit-element';

import { ProposalsProvider, UpdateRequest } from '@uprtcl/evees';
import { ProposalDetails, Proposal, NewProposal } from '@uprtcl/evees';
import { CASStore } from '@uprtcl/multiplatform';
import { EXPECTED_CONFIG, PolkadotCouncilEveesStorage } from './evees.council.store';
import { ProposalManifest } from './types';
import { PolkadotConnection } from '../connection.polkadot';
import { Lens } from '@uprtcl/lenses';

export class ProposalsPolkadotCouncil implements ProposalsProvider {
  logger = new Logger('PROPOSALS-POLKADOT-COUNCIL');

  constructor(
    protected connection: PolkadotConnection,
    protected councilStore: PolkadotCouncilEveesStorage,
    protected store: CASStore
  ) {}

  async ready(): Promise<void> {}

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
      config: EXPECTED_CONFIG,
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
}
