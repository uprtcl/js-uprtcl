import { property, html, css, LitElement, query } from 'lit-element';
import { ApolloClient } from 'apollo-boost';
const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { Logger, moduleConnect } from '@uprtcl/micro-orchestrator';
import { sharedStyles } from '@uprtcl/lenses';
import { Entity, CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';
import {
  EveesRemote,
  EveesModule,
  eveeColor,
  DEFAULT_COLOR,
  Perspective,
} from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';
import { loadEntity } from '@uprtcl/multiplatform';

export class WikiDrawer extends moduleConnect(LitElement) {
  logger = new Logger('WIKI-DRAWER');

  @property({ type: String, attribute: 'uref' })
  firstRef!: string;

  @property({ attribute: false })
  uref!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  author: string = '';

  protected client!: ApolloClient<any>;
  protected eveesRemotes!: EveesRemote[];
  protected recognizer!: PatternRecognizer;

  constructor() {
    super();
  }

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.eveesRemotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    this.logger.log('firstUpdated()', { uref: this.uref });

    this.uref = this.firstRef;
    this.load();
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('checkout-perspective', ((event: CustomEvent) => {
      this.uref = event.detail.perspectiveId;
    }) as EventListener);
  }

  async load() {
    this.loading = true;
    const perspective = (await loadEntity(this.client, this.uref)) as Entity<Signed<Perspective>>;
    this.author = perspective.object.payload.creatorId;
    this.loading = false;
  }

  draftsClicked() {
  }

  loggedIn() {
  }

  checkoutOfficial() {
    this.uref = this.firstRef
    this.load();
  }

  color() {
    if (this.firstRef === this.uref) {
      return DEFAULT_COLOR;
    } else {
      return eveeColor(this.uref as string);
    }
  }

  renderBreadcrumb() {
    return html`
      <uprtcl-button .skinny=${this.uref !== this.firstRef} @click=${() => this.checkoutOfficial()}>
        official
      </uprtcl-button>
      <uprtcl-button @click=${() => this.checkoutOfficial()}>
        proposals
      </uprtcl-button>
      <uprtcl-popper>
        <uprtcl-button 
          slot="icon"
          style=${`--background-color: ${this.color()}`} 
          class="evees-author"
          @click=${() => this.draftsClicked()}
          >${this.uref === this.firstRef ? 
            html`drafts` : 
            html`draft by
              <evees-author
                show-name
                user-id=${this.author}
                show-name
                short
                color=${eveeColor(this.uref)}
              ></evees-author
            >`}
        </uprtcl-button>
        <div class="">
          <evees-info-page uref=${this.uref} show-perspectives></evees-info-page>
        </div>
      </uprtcl-popper>
    `;
  }

  renderLoginWidget() {
    return html`
      <evees-login-widget @changed=${() => this.loggedIn()}></evees-login-widget>
    `;
  }

  render() {
    if (this.loading)
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;

    this.logger.log('rendering wiki after loading')

    return html`
      <div class="app-drawer">
        <div
          class="app-topbar"
          style=${styleMap({
            borderColor: this.color()
          })}
        >
          <div class="breadcrum-container">${this.renderBreadcrumb()}</div>
          <div class="login-widget-container">${this.renderLoginWidget()}</div>
        </div>

        <wiki-drawer-content uref=${this.uref}></wiki-drawer-content>
        
      </div>
    `;
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
          flex: 1 1 0;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji',
            Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol';
          font-size: 16px;
          color: #37352f;
          --mdc-theme-primary: #2196f3;
          width: 100%;
          position: relative;
        }
        .app-drawer {
          width: 100%;
          flex: 1 1 0;
          display: flex;
          flex-direction: column;
        }
        .app-topbar {
          width: 100%;
          display: flex;
          flex-direction: row;
          height: 68px;
          border-width: 5px;
          border-bottom-style: solid;
        }
        .breadcrum-container {
          flex: 1 1 0;
          padding: 16px;
          display: flex;
          flex-direction: row;
        }
        .breadcrum-container uprtcl-button {
          display: block;
          width: auto;
          margin-right: 8px;
        }
        .breadcrum-container .evees-author {
          --background-color: red;
        }
        .breadcrum-container uprtcl-button evees-author {
          --color: white;
        }
        .login-widget-container {
          flex: 0 0 0;
          padding: 16px;
        }
      `
    ];
  }
}
