import { html, css, property, query } from 'lit-element';
import { EveesInfoBase } from './evee-info-base';
import { Logger } from '@uprtcl/micro-orchestrator';
import { EveesPerspectivesList } from './evees-perspectives-list';
import { DEFAULT_COLOR, eveeColor } from './support';
import { loadEntity } from '@uprtcl/multiplatform';
import { Perspective } from '../types';
import { Entity, Signed } from '@uprtcl/cortex';
import { UprtclPopper } from '@uprtcl/common-ui';

export class EveesInfoRow extends EveesInfoBase {
  logger = new Logger('EVEES-INFO-ROW');

  @property({ attribute: false })
  author: string = '';

  @query('#drafts-popper')
  dratfsPopper!: UprtclPopper;

  @query('#evees-perspectives-list')
  eveesPerspectivesList!: EveesPerspectivesList;

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
    this.eveesPerspectivesList.load();
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

  render() {
    return html`
      ${this.uref === this.firstRef
        ? html`
            <uprtcl-button skinny @click=${() => this.showProposals()}>
              proposals
            </uprtcl-button>
          `
        : html`
            <uprtcl-button
              @click=${() => this.showPropose()}
              style=${`--background-color: ${this.color()}`}
              >propose
            </uprtcl-button>
          `}

      <uprtcl-popper id="drafts-popper" position="bottom-left" class="drafts-popper">
        <uprtcl-button
          slot="icon"
          style=${`--background-color: ${this.color()}`}
          class="evees-author"
          }
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
    `;
  }

  static get styles() {
    return super.styles.concat([
      css`
        :host {
          display: flex;
          flex-direction: row;
        }
        uprtcl-button-loading {
          margin: 0 auto;
        }
      `
    ]);
  }
}
