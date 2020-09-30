import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import {
  EveesBindings,
  EveesRemote,
  EveesWorkspace,
  NewPerspectiveData,
  Perspective,
  Secured
} from '@uprtcl/evees';

import { LocalProposal, ProposalManifest } from './types';
import { EveesPolkadotCouncil } from './evees.polkadot-council';
import { CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';
import { ProposalStatus } from './proposal.config.types';

export class EveesPolkadotCouncilProposal extends moduleConnect(LitElement) {
  @property({ type: String, attribute: 'proposal-id' })
  proposalId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  showDetails: boolean = false;

  client!: ApolloClient<any>;
  remote!: EveesPolkadotCouncil;

  proposalManifest!: ProposalManifest;
  recognizer!: PatternRecognizer;
  workspace!: EveesWorkspace;
  proposalStatus!: LocalProposal;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    const remote = (this.requestAll(EveesBindings.EveesRemote) as EveesRemote[]).find(remote =>
      remote.id.includes('evees-council')
    );

    if (!remote) throw new Error(`council remote not registered`);
    this.remote = remote as EveesPolkadotCouncil;
    this.load();
  }

  async load() {
    this.loading = true;
    await this.loadManifest();
    await this.loadWorkspace();
    await this.loadProposalStatus();
    this.loading = false;
  }

  async loadManifest() {
    const proposalManifest = (await this.remote.store.get(this.proposalId)) as ProposalManifest;
    if (!proposalManifest) throw new Error('Proposal not found');
    this.proposalManifest = proposalManifest;
  }

  async loadWorkspace() {
    this.workspace = new EveesWorkspace(this.client, this.recognizer);
    for (const update of this.proposalManifest.updates) {
      if (!update.fromPerspectiveId) {
        const perspective = (await this.remote.store.get(update.perspectiveId)) as Signed<
          Perspective
        >;
        if (!perspective) throw new Error(`Perspective ${update.perspectiveId} not found`);

        const secured: Secured<Perspective> = {
          id: update.perspectiveId,
          object: perspective,
          casID: this.remote.store.casID
        };
        const newPerspective: NewPerspectiveData = {
          details: {
            headId: update.newHeadId
          },
          perspective: secured
        };
        this.workspace.newPerspective(newPerspective);
      } else {
        this.workspace.update(update);
      }
    }
    /* new perspectives are added to the apollo cache to be able to read their head */
    this.workspace.precacheNewPerspectives(this.client);
  }

  async loadProposalStatus() {
    this.proposalStatus = await this.remote.proposals.getProposalStatus(this.proposalId);
  }

  showProposalDetails() {
    this.showDetails = true;
  }

  renderProposalStatus() {
    return html`
      <pre class="prop-value">${JSON.stringify(this.proposalStatus, undefined, 2)}</pre>
    `;
  }

  renderDetails() {
    return html`
      <uprtcl-dialog primary-text="close" @primary=${() => (this.showDetails = false)}>
        <div class="row">
          by
          <evees-author
            user-id=${this.proposalManifest.creatorId ? this.proposalManifest.creatorId : ''}
            show-name
          ></evees-author>
        </div>
        <evees-update-diff .workspace=${this.workspace}> </evees-update-diff>
        ${this.renderProposalStatus()}
      </uprtcl-dialog>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
    }

    const creatorId = this.proposalManifest.creatorId ? this.proposalManifest.creatorId : '';
    return html`
      <div @click=${() => this.showProposalDetails()} class="row-container">
        <div class="proposal-name">
          <evees-author user-id=${creatorId} show-name></evees-author>
        </div>
        <div class="proposal-state">
          <uprtcl-button icon=${'done'} skinny ?disabled=${false}>merge</uprtcl-button>
        </div>
        ${this.showDetails ? this.renderDetails() : ''}
      </div>
    `;
  }

  static get styles() {
    return css`
      .row-container {
        height: 100%;
        display: flex;
        flex-direction: row;
      }
      .proposal-name {
        height: 100%;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .proposal-state {
        width: 140px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .proposal-state uprtcl-button {
        margin: 0 auto;
      }
      .row {
        width: 100%;
        display: flex;
        align-items: center;
      }
      .row evees-author {
        margin-left: 10px;
      }
    `;
  }
}
