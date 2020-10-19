import { html, css, property, query } from 'lit-element';

import { Logger } from '@uprtcl/micro-orchestrator';
import { UprtclPopper } from '@uprtcl/common-ui';
import { loadEntity } from '@uprtcl/multiplatform';
import { Signed } from '@uprtcl/cortex';
import { EveesInfoBase, ProposalsList } from '@uprtcl/evees';

/** An evees handler designed to create a single draft per evee on the local storage */
export class EveesInfoLocal extends EveesInfoBase {
  logger = new Logger('EVEES-INFO-LOCAL');

  @property({ type: Boolean, attribute: 'show-proposals' })
  proposalsEnabled: boolean = false;

  @property({ type: Boolean, attribute: 'show-draft' })
  draftEnabled: boolean = false;

  @property({ type: Boolean, attribute: 'show-info' })
  infoEnabled: boolean = false;

  @property({ attribute: false })
  draftId: string | undefined = undefined;

  @property({ attribute: false })
  hasDrafts: boolean = false;

  @query('#drafts-popper')
  dratfsPopper!: UprtclPopper;

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
    if (this.eveesProposalsList && this.eveesProposalsList !== null) this.eveesProposalsList.load();

    if (!this.defaultRemote) throw new Error('default remote not found');

    const official = await loadEntity<Signed<Perspective>>(this.client, this.firstRef);
    if (!official) throw new Error(`official perspective ${this.firstRef}`);

    const [draftId] = await this.defaultRemote.getContextPerspectives(
      official.object.payload.context
    );
    this.draftId = draftId;
  }

  async loadDraftsStatus() {
    const defaultRemote = this.defaultRemote as EveesLocal;
    this.defaultRemote.getAl;
  }

  draftClicked() {
    if (this.draftId) {
      this.seeDraft();
    } else {
      this.createDraft();
    }
  }

  createDraft() {
    this.dratfsPopper.showDropdown = false;
    this.forkPerspective();
  }

  seeDraft() {
    this.dratfsPopper.showDropdown = false;
    this.checkoutPerspective(this.draftId);
  }

  proposeDraft() {
    this.dratfsPopper.showDropdown = false;
    this.otherPerspectiveMerge(this.uref, this.firstRef);
  }

  seeOriginal() {
    this.checkoutPerspective(this.firstRef);
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

  renderDraftSummary() {
    return this.hasDrafts
      ? html`
          <uprtcl-button>my drafts</uprtcl-button>
        `
      : '';
  }

  renderDraftControl() {
    return html`
      <uprtcl-button ?skinny=${this.uref !== this.firstRef} @click=${() => this.seeOriginal()}>
        original
      </uprtcl-button>

      <uprtcl-button
        ?skinny=${this.uref === this.firstRef}
        icon="edit"
        @click=${() => this.draftClicked()}
        class="margin-left draft-button"
        transition
        >draft</uprtcl-button
      >
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
    if (this.perspectiveData === undefined)
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;

    return html`
      ${this.infoEnabled
        ? html`
            <uprtcl-popper icon="info" id="info-popper" position="bottom-left" class="info-popper">
              ${this.renderInfo()}
            </uprtcl-popper>
          `
        : ''}
      ${this.proposalsEnabled
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
        : ''}
      ${this.draftEnabled ? this.renderDraftControl() : ''}
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
        .info-popper {
          --box-width: 490px;
          --max-height: 70vh;
        }
        uprtcl-button-loading {
          margin: 16px auto;
        }
        .proposals-button {
          width: 150px;
        }
        .drafts-icon {
          display: flex;
        }
        .draft-status {
          padding: 6px 12px;
        }
        .margin-left {
          margin-left: 10px;
        }
        .draft-button {
          --background-color: #00ad3a;
          --background-color-hover: #4fd47c;
        }
      `
    ]);
  }
}
