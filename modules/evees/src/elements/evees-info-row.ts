import { html, css, property, query } from 'lit-element';
import { EveesInfoBase } from './evee-info-base';
import { Logger } from '@uprtcl/micro-orchestrator';
import { EveesPerspectivesList } from './evees-perspectives-list';
import { DEFAULT_COLOR, eveeColor } from './support';
import { loadEntity } from '@uprtcl/multiplatform';
import { Perspective } from '../types';
import { Entity, Signed } from '@uprtcl/cortex';
import { UprtclPopper } from '@uprtcl/common-ui';
import { ProposalsList } from './evees-proposals-list';

export class EveesInfoRow extends EveesInfoBase {
  logger = new Logger('EVEES-INFO-ROW');

  @property({ attribute: false })
  author: string = '';

  @query('#drafts-popper')
  dratfsPopper!: UprtclPopper;

  @query('#evees-perspectives-list')
  eveesPerspectivesList!: EveesPerspectivesList;

  @query('#evees-proposals-list')
  eveesProposalsList!: ProposalsList;

  async firstUpdated() {
    super.firstUpdated();
  }

  connectedCallback() {
    super.connectedCallback();
    this.logger.log('Connected', this.uref);
  }

  async disconnectedCallback() {
    super.disconnectedCallback();
    this.logger.log('Disconnected', this.uref);
  }

  async load() {
    super.load();

    if (this.eveesPerspectivesList && this.eveesPerspectivesList !== null) {
      this.eveesPerspectivesList.load();
    }

    if (this.eveesProposalsList && this.eveesProposalsList !== null) this.eveesProposalsList.load();

    const perspective = (await loadEntity(this.client, this.uref)) as Entity<Signed<Perspective>>;
    this.author = perspective.object.payload.creatorId;
  }

  checkoutPerspective(perspectiveId) {
    this.dratfsPopper.showDropdown = false;
    this.dispatchEvent(
      new CustomEvent('checkout-perspective', {
        detail: {
          perspectiveId: perspectiveId
        },
        composed: true,
        bubbles: true
      })
    );
  }

  showPropose() {}

  showProposals() {}

  color() {
    if (this.firstRef === this.uref) {
      return DEFAULT_COLOR;
    } else {
      return eveeColor(this.uref as string);
    }
  }

  renderOtherPerspectives() {
    return html`
      <div class="list-container">
        ${!this.loading
          ? html`
              <evees-perspectives-list
                id="evees-perspectives-list"
                perspective-id=${this.uref}
                .hidePerspectives=${[this.firstRef]}
                ?can-propose=${this.isLogged}
                @perspective-selected=${e => this.checkoutPerspective(e.detail.id)}
                @merge-perspective=${e =>
                  this.otherPerspectiveMerge(e.detail.perspectiveId, this.uref)}
              ></evees-perspectives-list>
            `
          : html`
              <uprtcl-loading></uprtcl-loading>
            `}
        ${this.isLoggedOnDefault
          ? html`
              <uprtcl-button-loading
                skinny
                icon="call_split"
                @click=${this.newPerspectiveClicked}
                loading=${this.creatingNewPerspective ? 'true' : 'false'}
              >
                new draft
              </uprtcl-button-loading>
            `
          : ''}
      </div>
    `;
  }

  renderProposals() {
    return html`
      <div class="list-container">
        ${!this.loading
          ? html`
              <evees-proposals-list
                id="evees-proposals-list"
                force-update=${this.forceUpdate}
                perspective-id=${this.uref}
                @execute-proposal=${this.executeProposal}
              ></evees-proposals-list>
            `
          : html`
              <uprtcl-loading></uprtcl-loading>
            `}
      </div>
    `;
  }

  render() {
    return html`
      ${this.uref === this.firstRef
        ? html`
            <uprtcl-popper id="drafts-popper" position="bottom-left" class="drafts-popper">
              <uprtcl-button
                slot="icon"
                class="proposals-button"
                icon="arrow_drop_down"
                skinny
                @click=${() => this.showProposals()}
                transition
              >
                proposals
              </uprtcl-button>
              ${this.renderProposals()}
            </uprtcl-popper>
          `
        : html`
            <uprtcl-button
              ?disabled=${!this.isLogged}
              icon="arrow_back"
              @click=${() => this.otherPerspectiveMerge(this.uref, this.firstRef)}
              style=${`--background-color: ${this.color()}`}
              class="proposals-button"
              transition
              >${this.perspectiveData.canWrite ? 'merge' : 'propose'}
            </uprtcl-button>
          `}

      <uprtcl-popper id="drafts-popper" position="bottom-left" class="drafts-popper">
        <uprtcl-button
          icon="arrow_drop_down"
          ?skinny=${this.uref === this.firstRef}
          slot="icon"
          style=${`--background-color: ${this.uref !== this.firstRef ? this.color() : 'initial'}`}
          class=${this.uref === this.firstRef ? 'draft-button' : ''}
          transition
          >${this.uref === this.firstRef
            ? html`
                drafts
              `
            : html`
                draft by
                <evees-author
                  show-name
                  user-id=${this.author}
                  show-name
                  short
                  color=${eveeColor(this.uref)}
                ></evees-author>
              `}
        </uprtcl-button>
        ${this.renderOtherPerspectives()}
      </uprtcl-popper>
      ${this.showUpdatesDialog ? this.renderUpdatesDialog() : ''}
    `;
  }

  static get styles() {
    return super.styles.concat([
      css`
        :host {
          display: flex;
          flex-direction: row;
        }
        .drafts-popper {
          margin-left: 8px;
          --box-width: 340px;
        }
        uprtcl-button-loading {
          margin: 16px auto;
        }
        .proposals-button {
          width: 150px;
        }
        .draft-button {
          width: 150px;
        }
        evees-perspectives-list {
          border-bottom: 1px solid #cccccc;
        }
      `
    ]);
  }
}
