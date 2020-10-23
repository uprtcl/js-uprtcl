import { html, css, property, query } from 'lit-element';

import { Logger } from '@uprtcl/micro-orchestrator';
import { UprtclPopper } from '@uprtcl/common-ui';
import { loadEntity } from '@uprtcl/multiplatform';
import { Entity, Signed } from '@uprtcl/cortex';
import { EveesInfoBase } from './evees-info-base';
import { EveesPerspectivesList } from './evees-perspectives-list';
import { ProposalsList } from './evees-proposals-list';
import { Perspective } from '../types';
import { EveesRemote } from '../services/evees.remote';
import { DEFAULT_COLOR, eveeColor } from './support';
import { Secured } from '../utils/cid-hash';
import { ContentUpdatedEvent, CONTENT_UPDATED_TAG } from './events';

/** An evees info with
 *  - one official remote with the official perspective
 *  - one defaultRemote with one perspective per user */
export class EveesInfoUserBased extends EveesInfoBase {
  logger = new Logger('EVEES-INFO-UserBased');

  @property({ type: Boolean, attribute: 'show-proposals' })
  proposalsEnabled: boolean = false;

  @property({ type: Boolean, attribute: 'show-draft' })
  draftEnabled: boolean = false;

  @property({ type: Boolean, attribute: 'show-info' })
  infoEnabled: boolean = false;

  @property({ type: String, attribute: 'official-owner' })
  officialOwner!: string;

  @property({ attribute: false })
  officialId: string | undefined = undefined;

  @property({ attribute: false })
  mineId: string | undefined = undefined;

  @property({ attribute: false })
  author!: string;

  @property({ attribute: false })
  isTheirs!: boolean;

  @property({ attribute: false })
  isMine!: boolean;

  @property({ attribute: false })
  isOfficial!: boolean;

  @property({ attribute: false })
  hasPull!: boolean;

  @property({ attribute: false })
  creatingMine: boolean = false;

  @query('#proposals-popper')
  proposalsPopper!: UprtclPopper;

  @query('#perspectives-popper')
  perspectivesPopper!: UprtclPopper;

  @query('#evees-perspectives-list')
  perspectivesList!: EveesPerspectivesList;

  @query('#evees-proposals-list')
  eveesProposalsList!: ProposalsList;

  async firstUpdated() {
    await super.firstUpdated();
    this.load();
  }

  connectedCallback() {
    super.connectedCallback();
    this.logger.log('Connected', this.uref);
  }

  async disconnectedCallback() {
    super.disconnectedCallback();
    this.logger.log('Disconnected', this.uref);
  }

  /** overwrite  */
  updated(changedProperties) {
    if (changedProperties.has('uref')) {
      this.logger.info('updated() UserBased reload', { changedProperties });
      this.load();
    }
  }

  async load() {
    this.logger.info('load() UserBased', { uref: this.uref, firstRef: this.firstRef });

    await super.firstUpdated();
    await super.load();

    this.loading = true;

    /** from all the perspectives of this evee we must identify the official perspective and this
     * user perspective in the default remote  */
    const first = await loadEntity<Signed<Perspective>>(this.client, this.firstRef);
    if (!first) throw new Error(`first perspective ${this.firstRef}`);

    const perspectiveIds = await this.getContextPerspectives(this.firstRef);
    const perspectives = ((await Promise.all(
      perspectiveIds.map(perspectiveId =>
        loadEntity<Signed<Perspective>>(this.client, perspectiveId)
      )
    )) as unknown) as Secured<Perspective>[];

    if (!this.defaultRemote) throw new Error('default remote not found');
    const defaultRemote: EveesRemote = this.defaultRemote;

    if (!this.officialRemote) throw new Error('official remote not found');
    const officialRemote: EveesRemote = this.officialRemote;

    const official = perspectives.find(
      p =>
        p.object.payload.remote === officialRemote.id &&
        p.object.payload.creatorId === this.officialOwner
    );
    const mine = perspectives.find(
      p =>
        p.object.payload.remote === defaultRemote.id &&
        p.object.payload.creatorId === defaultRemote.userId
    );

    if (official) {
      this.dispatchEvent(
        new CustomEvent('official-id', {
          detail: {
            perspectiveId: official.id
          },
          bubbles: false,
          composed: false
        })
      );
      this.officialId = official.id;
    }

    this.mineId = mine ? mine.id : undefined;

    this.isTheirs = this.uref !== this.mineId && this.uref !== this.officialId;
    this.isMine = this.uref === this.mineId;
    this.isOfficial = this.uref === this.officialId;

    /** check pull from official*/
    if (this.isMine && this.officialId !== undefined) {
      this.checkPull(this.officialId).then(() => {
        this.hasPull = this.pullWorkspace !== undefined && this.pullWorkspace.hasUpdates();
      });
    }

    /** get the current perspective author */
    const nowPerspective = await loadEntity<Signed<Perspective>>(this.client, this.uref);
    if (!nowPerspective) throw new Error(`official perspective ${this.uref}`);

    this.author = nowPerspective.object.payload.creatorId;

    /** force load of perspectives and proposals lists */
    if (this.eveesProposalsList && this.eveesProposalsList !== null) this.eveesProposalsList.load();
    if (this.perspectivesList) this.perspectivesList.load();

    this.loading = false;
  }

  draftClicked() {
    if (this.mineId) {
      this.seeDraft();
    } else {
      this.createDraft();
    }
  }

  closePoppers() {
    if (this.proposalsPopper) this.proposalsPopper.showDropdown = false;
    if (this.perspectivesPopper) this.perspectivesPopper.showDropdown = false;
  }

  async createDraft() {
    this.closePoppers();
    this.creatingMine = true;
    await this.forkPerspective();
    this.creatingMine = false;
  }

  seeDraft() {
    this.closePoppers();
    this.checkoutPerspective(this.mineId);
  }

  proposeDraft() {
    this.logger.log('propose draft');
    if (!this.officialId) throw new Error('can only propose to official');
    this.closePoppers();
    this.otherPerspectiveMerge(this.uref, this.officialId);
  }

  seeOfficial() {
    this.closePoppers();
    this.checkoutPerspective(this.officialId);
  }

  async showPull() {
    this.logger.log('show pull');

    if (!this.pullWorkspace) throw new Error('pullWorkspace undefined');

    const confirm = await this.updatesDialog(this.pullWorkspace, 'apply', 'close');

    if (!confirm) {
      return;
    }
    await this.pullWorkspace.execute(this.client);

    this.dispatchEvent(
      new ContentUpdatedEvent({
        detail: {
          uref: this.uref
        },
        bubbles: true,
        composed: true
      })
    );
  }

  checkoutPerspective(perspectiveId) {
    this.closePoppers();
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

  color() {
    if (this.isOfficial) {
      return DEFAULT_COLOR;
    } else {
      return eveeColor(this.author);
    }
  }

  renderOtherPerspectives() {
    const hidePerspectives: string[] = [];

    if (this.officialId) hidePerspectives.push(this.officialId);
    if (this.mineId) hidePerspectives.push(this.mineId);

    return html`
      <div class="list-container">
        <evees-perspectives-list
          id="evees-perspectives-list"
          perspective-id=${this.uref}
          .hidePerspectives=${hidePerspectives}
          ?can-propose=${this.isLogged}
          @perspective-selected=${e => this.checkoutPerspective(e.detail.id)}
          @merge-perspective=${e => this.otherPerspectiveMerge(e.detail.perspectiveId, this.uref)}
        ></evees-perspectives-list>
      </div>
    `;
  }

  renderDraftControl() {
    return html`
      <uprtcl-button
        class="tab-button"
        ?skinny=${this.uref !== this.firstRef}
        @click=${() => this.seeOfficial()}
        ?disabled=${this.officialId === undefined}
        transition
      >
        common
      </uprtcl-button>
      ${this.isLogged && this.isLoggedOnDefault
        ? html`
            <uprtcl-icon-button
              button
              class=${this.isTheirs || this.isMine ? 'margin-left highlighted' : 'margin-left'}
              icon="arrow_back"
              @click=${() => (this.isTheirs || this.isMine ? this.proposeDraft() : undefined)}
              ?disabled=${this.isOfficial}
              style=${`--background-color: ${
                this.isTheirs || this.isMine ? this.color() : 'initial'
              }`}
            >
            </uprtcl-icon-button>
            <uprtcl-icon-button
              button
              class=${this.hasPull ? 'margin-left highlighted' : 'margin-left'}
              icon="arrow_forward"
              @click=${() => (this.isMine && this.hasPull ? this.showPull() : undefined)}
              ?disabled=${!this.hasPull}
              style=${`--background-color: ${
                this.isTheirs || this.isMine ? this.color() : 'initial'
              }`}
            >
            </uprtcl-icon-button>
          `
        : ''}
      ${this.isLoggedOnDefault
        ? html`
            <uprtcl-button-loading
              ?skinny=${!this.isMine}
              @click=${() => this.draftClicked()}
              class="margin-left tab-button"
              style=${`--background-color: ${this.isMine ? this.color() : 'initial'}`}
              ?loading=${this.creatingMine}
              transition
            >
              mine
            </uprtcl-button-loading>
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
          ?skinny=${!this.isTheirs}
          style=${`--background-color: ${this.isTheirs ? this.color() : 'initial'}`}
          class="tab-other"
          transition
          >${this.isTheirs
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

  renderPermissions() {
    return html`
      <div class="perspectives-permissions">
        ${!this.loading
          ? this.remote.accessControl.lense().render({ uref: this.uref, parentId: this.parentId })
          : ''}
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
                class="info-popper margin-right"
              >
                <div class="permissions-container">${this.renderPermissions()}</div>
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
          --box-width: 340px;
        }
        .info-popper {
          --box-width: 490px;
          --max-height: 70vh;
          --overflow: auto;
        }
        .perspectives-popper {
          --box-width: 340px;
        }
        .proposals-button {
          width: 150px;
        }
        .margin-left {
          margin-left: 10px;
        }
        .margin-right {
          margin-right: 10px;
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
        .permissions-container {
          padding: 12px;
          border-bottom: solid 1px #cccccc;
        }
      `
    ]);
  }
}
