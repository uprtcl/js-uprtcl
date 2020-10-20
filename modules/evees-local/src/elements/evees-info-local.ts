import { html, css, property, query } from 'lit-element';

import { Logger } from '@uprtcl/micro-orchestrator';
import { UprtclPopper } from '@uprtcl/common-ui';
import { loadEntity } from '@uprtcl/multiplatform';
import { Signed } from '@uprtcl/cortex';
import {
  DEFAULT_COLOR,
  eveeColor,
  EveesInfoBase,
  EveesPerspectivesList,
  EveesRemote,
  Perspective,
  ProposalsList,
  Secured
} from '@uprtcl/evees';
import { EveesLocal } from '../provider/evees.local';

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
  author!: string;

  @query('#proposals-popper')
  proposalsPopper!: UprtclPopper;

  @query('#perspectives-popper')
  perspectivesPopper!: UprtclPopper;

  @query('#evees-perspectives-list')
  perspectivesList!: EveesPerspectivesList;

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
    const defaultRemote: EveesRemote = this.defaultRemote;

    const official = await loadEntity<Signed<Perspective>>(this.client, this.firstRef);
    if (!official) throw new Error(`official perspective ${this.firstRef}`);

    const otherPerspectives = await defaultRemote.getContextPerspectives(
      official.object.payload.context
    );

    const thisPerspective = await loadEntity<Signed<Perspective>>(this.client, this.uref);
    if (!thisPerspective) throw new Error(`official perspective ${this.uref}`);

    this.author = thisPerspective.object.payload.creatorId;

    /** force one perspective per user on the default remote (this perspective is the draft of that user) */
    for (const id of otherPerspectives) {
      const perspective = await loadEntity<Signed<Perspective>>(this.client, id);
      if (!perspective) throw new Error('default remote not found');
      if (perspective.object.payload.creatorId === defaultRemote.userId) {
        this.draftId = id;
        break;
      }
    }

    if (this.perspectivesList) this.perspectivesList.load();
  }

  draftClicked() {
    if (this.draftId) {
      this.seeDraft();
    } else {
      this.createDraft();
    }
  }

  createDraft() {
    this.proposalsPopper.showDropdown = false;
    this.perspectivesPopper.showDropdown = false;
    this.forkPerspective();
  }

  seeDraft() {
    this.proposalsPopper.showDropdown = false;
    this.perspectivesPopper.showDropdown = false;
    this.checkoutPerspective(this.draftId);
  }

  proposeDraft() {
    this.proposalsPopper.showDropdown = false;
    this.perspectivesPopper.showDropdown = false;
    this.otherPerspectiveMerge(this.uref, this.firstRef);
  }

  seeOriginal() {
    this.checkoutPerspective(this.firstRef);
  }

  checkoutPerspective(perspectiveId) {
    this.proposalsPopper.showDropdown = false;
    this.perspectivesPopper.showDropdown = false;
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
        <evees-perspectives-list
          id="evees-perspectives-list"
          perspective-id=${this.uref}
          .hidePerspectives=${[this.firstRef, this.draftId]}
          ?can-propose=${this.isLogged}
          @perspective-selected=${e => this.checkoutPerspective(e.detail.id)}
          @merge-perspective=${e => this.otherPerspectiveMerge(e.detail.perspectiveId, this.uref)}
        ></evees-perspectives-list>
      </div>
    `;
  }

  renderDraftControl() {
    const isTheirs = this.firstRef !== this.uref && this.uref !== this.draftId;
    const isMine = this.firstRef !== this.uref && this.uref === this.draftId;

    return html`
      <uprtcl-button
        class="tab-button"
        ?skinny=${this.uref !== this.firstRef}
        @click=${() => this.seeOriginal()}
        transition
      >
        common
      </uprtcl-button>
      ${this.isLogged
        ? html`
            <uprtcl-button
              class=${isTheirs || isMine ? 'margin-left highlighted' : 'margin-left'}
              icon="arrow_back"
              @click=${() => this.proposeDraft()}
            >
              merge
            </uprtcl-button>
          `
        : ''}
      ${this.isLogged
        ? html`
            <uprtcl-button
              ?skinny=${!isMine}
              @click=${() => this.draftClicked()}
              class="margin-left tab-button"
              style=${`--background-color: ${isMine ? this.color() : 'initial'}`}
              transition
            >
              mine
            </uprtcl-button>
          `
        : ''}

      <uprtcl-popper
        id="perspectives-popper"
        position="bottom-left"
        class="perspectives-popper margin-left"
      >
        <uprtcl-button
          slot="icon"
          icon="arrow_drop_down"
          ?skinny=${!isTheirs}
          style=${`--background-color: ${isTheirs ? this.color() : 'initial'}`}
          class="tab-other"
          transition
          >${isTheirs
            ? html`
                <evees-author
                  show-name
                  user-id=${this.author}
                  show-name
                  short
                  color=${eveeColor(this.uref)}
                ></evees-author>
              `
            : html`
                other
              `}
        </uprtcl-button>
        ${this.renderOtherPerspectives()}
      </uprtcl-popper>
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
      <div class="left-buttons">
        ${this.infoEnabled
          ? html`
              <uprtcl-popper
                icon="info"
                id="info-popper"
                position="bottom-left"
                class="info-popper"
              >
                ${this.renderInfo()}
              </uprtcl-popper>
            `
          : ''}
        ${this.proposalsEnabled
          ? html`
              <uprtcl-popper id="proposals-popper" position="bottom-left" class="proposals-popper">
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
      </div>
      <div class="center-buttons">
        ${this.draftEnabled ? this.renderDraftControl() : ''}
      </div>
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
        .proposals-popper {
          margin-left: 8px;
          --box-width: 340px;
        }
        .info-popper {
          --box-width: 490px;
          --max-height: 70vh;
        }
        .proposals-button {
          width: 150px;
        }
        .margin-left {
          margin-left: 10px;
        }
        .tab-button {
          width: 120px;
        }
        .tab-other {
          width: 160px;
        }
        .left-buttons {
          flex: 0 0 auto;
          display: flex;
        }
        .center-buttons {
          flex: 1 1 auto;
          display: flex;
          justify-content: center;
        }
        .highlighted {
          --background-color: #00b31e;
        }
      `
    ]);
  }
}
