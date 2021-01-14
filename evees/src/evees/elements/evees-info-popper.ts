import { html, css, property, LitElement, query } from 'lit-element';

import { UprtclPopper } from '@uprtcl/common-ui';

import { eveesConnect } from '../../container/evees-connect.mixin';
import { Logger } from '../../utils/logger';

import { Evees } from '../evees.service';

import { EveesInfoConfig } from './evees-info-user-based';
import { DEFAULT_COLOR, eveeColor } from './support';

export class EveesInfoPopper extends eveesConnect(LitElement) {
  logger = new Logger('EVEES-INFO-POPPER');

  @property({ type: String, attribute: 'uref' })
  uref!: string;

  @property({ type: String, attribute: 'first-uref' })
  firstRef!: string;

  @property({ type: String, attribute: 'parent-id' })
  parentId!: string;

  @property({ type: String, attribute: 'official-owner' })
  officialOwner: string | undefined = undefined;

  @property({ type: Boolean, attribute: 'check-owner' })
  checkOwner: boolean = false;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor!: string;

  @property({ type: Object })
  eveesInfoConfig!: EveesInfoConfig;

  @property({ attribute: false })
  officialId!: string;

  @property({ attribute: false })
  creatorId!: string;

  @property({ attribute: false })
  dropdownShown: boolean = false;

  @query('#info-popper')
  infoPopper!: UprtclPopper;

  async firstUpdated() {
    await this.load();
  }

  async load() {
    const current = await this.evees.client.store.getEntity(this.uref);
    if (!current) throw new Error(`cant find current perspective ${this.uref}`);

    this.creatorId = current.object.payload.creatorId;
  }

  color() {
    return this.officialId && this.uref === this.officialId
      ? DEFAULT_COLOR
      : this.uref === this.firstRef
      ? this.eveeColor
      : eveeColor(this.creatorId);
  }

  updated(changedProperties) {
    if (changedProperties.has('uref')) {
      this.load();
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('checkout-perspective', ((event: CustomEvent) => {
      this.infoPopper.showDropdown = false;
      this.requestUpdate();
    }) as EventListener);
  }

  officialIdReceived(perspectiveId: string) {
    this.officialId = perspectiveId;
  }

  handleDragStart(e) {
    const dragged = { uref: this.uref, parentId: this.parentId };
    this.logger.info('dragging', dragged);
    e.dataTransfer.setData('text/plain', JSON.stringify(dragged));
  }

  render() {
    return html`
      <uprtcl-popper
        id="info-popper"
        position="right"
        @drop-down-changed=${(e) => (this.dropdownShown = e.detail.shown)}
      >
        <div
          draggable=${this.eveesInfoConfig.isDraggable ? 'true' : 'false'}
          @dragstart=${this.handleDragStart}
          slot="icon"
          class="evee-stripe"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill=${this.color()}
            width="18px"
            height="18px"
          >
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </div>
        ${this.dropdownShown
          ? html`
              <div class="evees-info">
                <evees-info-user-based
                  .eveesInfoConfig=${this.eveesInfoConfig}
                  uref=${this.uref}
                  parent-id=${this.parentId}
                  first-uref=${this.firstRef as string}
                  @official-id=${(e) => this.officialIdReceived(e.detail.perspectiveId)}
                ></evees-info-user-based>
              </div>
            `
          : ``}
      </uprtcl-popper>
    `;
  }

  static get styles() {
    return [
      css`
        :host {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        uprtcl-popper {
          flex-grow: 1;
        }
        .evees-info {
          padding: 10px;
          display: block;
        }
        .evee-stripe {
          cursor: pointer;
          padding: 5px 6px 0px;
          height: 100%;
          border-radius: 15px;
          user-select: none;
          transition: background-color 100ms linear;
        }
        .evee-stripe:hover {
          background-color: #eef1f1;
        }
      `,
    ];
  }
}
