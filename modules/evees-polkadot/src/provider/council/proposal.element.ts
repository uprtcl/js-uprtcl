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

import { LocalProposal, ProposalManifest, Vote } from './types';
import { EveesPolkadotCouncil } from './evees.polkadot-council';
import { CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';
import { ProposalStatus, VoteValue } from './proposal.config.types';

export class EveesPolkadotCouncilProposal extends moduleConnect(LitElement) {
  @property({ type: String, attribute: 'proposal-id' })
  proposalId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  showDetails: boolean = false;

  client!: ApolloClient<any>;
  remote!: EveesPolkadotCouncil;

  recognizer!: PatternRecognizer;
  workspace!: EveesWorkspace;
  proposalStatus!: LocalProposal;
  proposalManifest!: ProposalManifest;
  proposalStatusUI!: {
    status: ProposalStatus;
    votedYes: Vote[];
    votedNo: Vote[];
    council: string[];
    isCouncilMember: boolean;
  };

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

  async vote(value: VoteValue) {
    await this.remote.proposals.vote(this.proposalId, value);
    this.load();
  }

  async loadProposalStatus() {
    this.proposalStatus = await this.remote.proposals.getProposalStatus(this.proposalId);

    if (!this.proposalStatus.status) throw new Error('Vote status not found');

    const status = this.proposalStatus.status;
    const votedYes = status.votes.filter(vote => vote.value === VoteValue.Yes);
    const votedNo = status.votes.filter(vote => vote.value === VoteValue.No);
    const council = await this.remote.proposals.councilStore.getCouncil(
      this.proposalManifest.block
    );

    this.proposalStatusUI = {
      status: status.status,
      votedYes,
      votedNo,
      council,
      isCouncilMember: this.remote.userId ? council.includes(this.remote.userId) : false
    };
  }

  showProposalDetails() {
    this.showDetails = true;
  }

  renderCouncilMember() {
    return html`
      <div>
        <uprtcl-button @click=${() => this.vote(VoteValue.Yes)} icon="done">Approve</uprtcl-button>
        <uprtcl-button @click=${() => this.vote(VoteValue.No)} icon="clear">Reject</uprtcl-button>
      </div>
    `;
  }

  renderProposalStatus() {
    return html`
      <div class="status-top">
        <div class="status-status">${this.proposalStatusUI.status}</div>
        <div>${this.proposalStatusUI.votedYes.length}/${this.proposalStatusUI.council.length}</div>
        <div>
          ${this.proposalStatusUI.council.length -
            this.proposalStatusUI.votedYes.length -
            this.proposalStatusUI.votedNo.length}
          pending
        </div>
      </div>
      <uprtcl-list
        >${this.proposalStatusUI.votedYes.concat(this.proposalStatusUI.votedNo).map(vote => {
          let icon: string;
          switch (vote.value) {
            case VoteValue.Yes:
              icon = 'done';
              break;
            case VoteValue.No:
              icon = 'clear';
              break;

            case VoteValue.Undefined:
              icon = 'question';
              break;

            default:
              throw new Error(`Unexpected vote value ${vote.value}`);
          }

          html`
            <uprtcl-list-item
              ><uprtcl-icon-button icon=${icon} button></uprtcl-icon-button
              ><evees-author user-id=${vote.member} show-name></evees-author
            ></uprtcl-list-item>
          `;
        })}</uprtcl-list
      >
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
        ${this.proposalStatusUI.isCouncilMember ? this.renderCouncilMember() : ''}
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
