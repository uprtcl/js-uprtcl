import { html, css, property, LitElement, query } from 'lit-element';
import { DEFAULT_COLOR, eveeColor } from './support';
import { UprtclPopper } from '@uprtcl/common-ui';
import { threadId } from 'worker_threads';
import { Logger, moduleConnect } from '@uprtcl/micro-orchestrator';
import { loadEntity } from '@uprtcl/multiplatform';
import { ApolloClient } from 'apollo-boost';
import { ApolloClientModule } from '@uprtcl/graphql';
import { Signed } from '@uprtcl/cortex';
import { Perspective } from '../types';

const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

export class EveesInfoPopper extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-INFO-POPPER');

  @property({ type: String, attribute: 'uref' })
  uref!: string;

  @property({ type: String, attribute: 'first-uref' })
  firstRef!: string;

  @property({ type: String, attribute: 'parent-id' })
  parentId!: string;

  @property({ type: String, attribute: 'official-owner' })
  officialOwner: string | undefined = undefined;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor!: string;

  @property({ type: Boolean, attribute: 'show-perspectives' })
  showPerspectives: boolean = false;

  @property({ type: Boolean, attribute: 'show-proposals' })
  showProposals: boolean = false;

  @property({ type: Boolean, attribute: 'show-acl' })
  showAcl: boolean = false;

  @property({ type: Boolean, attribute: 'show-info' })
  showInfo: boolean = false;

  @property({ type: Boolean, attribute: 'emit-proposals' })
  emitProposals: boolean = false;

  @property({ attribute: false })
  officialId!: string;

  @property({ attribute: false })
  creatorId!: string;

  @query('#info-popper')
  infoPopper!: UprtclPopper;

  protected client!: ApolloClient<any>;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    await this.load();
  }

  async load() {
    const current = await loadEntity<Signed<Perspective>>(this.client, this.uref);
    if (!current) throw new Error(`cant find current perspective ${this.uref}`);

    this.creatorId = current.object.payload.creatorId;
  }

  color() {
    return this.officialId && this.uref === this.officialId
      ? DEFAULT_COLOR
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
      <uprtcl-popper id="info-popper" position="right">
        <div draggable="true" @dragstart=${this.handleDragStart} slot="icon" class="button">
          <div
            class="evee-stripe"
            style=${styleMap({
              backgroundColor: this.color() + 'FF'
            })}
          ></div>
        </div>
        <div class="evees-info">
          <evees-info-user-based
            ?show-draft=${this.showPerspectives}
            ?show-proposals=${this.showProposals}
            ?show-info=${this.showInfo}
            ?emit-proposals=${this.showInfo}
            uref=${this.uref}
            parent-id=${this.parentId}
            first-uref=${this.firstRef as string}
            official-owner=${this.officialOwner as string}
            @official-id=${e => this.officialIdReceived(e.detail.perspectiveId)}
          ></evees-info-user-based>
        </div>
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
        .button {
          cursor: pointer;
          padding-top: 5px;
          height: 100%;
          border-radius: 3px;
          user-select: none;
          transition: background-color 100ms linear;
        }
        .button:hover {
          background-color: #eef1f1;
        }
        .evee-stripe {
          width: 10px;
          height: calc(100% - 10px);
          border-radius: 3px;
        }
      `
    ];
  }
}
