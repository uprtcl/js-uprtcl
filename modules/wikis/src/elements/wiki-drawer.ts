import { property, html, css, LitElement, query } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
const styleMap = (style) => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(
      /([A-Z])/g,
      (matches) => `-${matches[0].toLowerCase()}`
    );
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { Logger, moduleConnect } from '@uprtcl/micro-orchestrator';
import { sharedStyles } from '@uprtcl/lenses';
import { CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';
import {
  EveesRemote,
  EveesModule,
  eveeColor,
  DEFAULT_COLOR,
  Perspective,
  CONTENT_UPDATED_TAG,
  ContentUpdatedEvent,
} from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';
import { WikiDrawerContent } from './wiki-drawer-content';
import { loadEntity } from '@uprtcl/multiplatform';
import {
  CREATE_PROPOSAL,
  PROPOSAL_CREATED_TAG,
  EveesInfoConfig,
} from '@uprtcl/evees';
import { ProposalCreatedEvent } from '@uprtcl/evees/dist/types/types';

export class WikiDrawer extends moduleConnect(LitElement) {
  logger = new Logger('WIKI-DRAWER');

  @property({ type: String, attribute: 'uref' })
  firstRef!: string;

  @property({ type: Boolean, attribute: 'show-back' })
  showBack: boolean = false;

  @property({ type: Object })
  eveesInfoConfig!: EveesInfoConfig;

  @property({ attribute: false })
  uref!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  creatorId!: string;

  @query('#wiki-drawer-content')
  content!: WikiDrawerContent;

  @query('#evees-info-row')
  eveesInfoLocal!: any;

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

    /** the official owner is the creator of the firstRef of the Wiki,
     * the firstRef is comming from the outside e.g. browser url. */
    const official = await loadEntity<Signed<Perspective>>(
      this.client,
      this.firstRef
    );
    if (!official)
      throw new Error(`cant find official perspective ${this.firstRef}`);
    this.eveesInfoConfig.officialOwner = official.object.payload.creatorId;

    await this.load();
    this.loading = false;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('checkout-perspective', ((event: CustomEvent) => {
      this.uref = event.detail.perspectiveId;
      this.content.reset();
    }) as EventListener);

    this.addEventListener(CONTENT_UPDATED_TAG, ((
      event: ContentUpdatedEvent
    ) => {
      if (this.uref === event.detail.uref) {
        this.content.load();
      }
    }) as EventListener);

    this.addEventListener(PROPOSAL_CREATED_TAG, ((
      event: ProposalCreatedEvent
    ) => {
      this.catchMergeProposal(event);
    }) as EventListener);
  }

  async load() {
    const current = await loadEntity<Signed<Perspective>>(
      this.client,
      this.uref
    );
    if (!current) throw new Error(`cant find current perspective ${this.uref}`);

    this.creatorId = current.object.payload.creatorId;
  }

  async forceReload() {
    this.loading = true;
    await this.updateComplete;
    await this.client.resetStore();
    this.load();
    this.loading = false;
  }

  updated(changedProperties) {
    if (changedProperties.has('uref')) {
      this.load();
    }
  }

  async catchMergeProposal(e: ProposalCreatedEvent) {
    await this.client.mutate({
      mutation: CREATE_PROPOSAL,
      variables: {
        toPerspectiveId: this.firstRef,
        fromPerspectiveId: this.uref,
        newPerspectives: e.detail.proposalDetails.newPerspectives,
        updates: e.detail.proposalDetails.updates,
      },
    });
    this.eveesInfoLocal.load();
  }

  color() {
    if (this.firstRef === this.uref) {
      return DEFAULT_COLOR;
    } else {
      return eveeColor(this.creatorId);
    }
  }

  loggedIn() {
    this.content.load();
    this.eveesInfoLocal.load();
  }

  renderBreadcrumb() {
    return html`
      ${this.showBack
        ? html`
            <uprtcl-icon-button
              skinny
              button
              class="back-button"
              icon="arrow_back"
              @click=${() => this.dispatchEvent(new CustomEvent('back'))}
            ></uprtcl-icon-button>
          `
        : ``}
      <evees-info-user-based
        id="evees-info-row"
        uref=${this.uref}
        first-uref=${this.firstRef}
        .eveesInfoConfig=${this.eveesInfoConfig}
      >
      </evees-info-user-based>
    `;
  }

  renderLoginWidget() {
    return html`
      <uprtcl-icon-button
        skinny
        button
        class="reload-button"
        icon="cached"
        @click=${() => this.forceReload()}
      ></uprtcl-icon-button>
      <evees-login-widget
        @changed=${() => this.loggedIn()}
      ></evees-login-widget>
    `;
  }

  render() {
    if (this.loading) return html` <uprtcl-loading></uprtcl-loading> `;

    this.logger.log('rendering wiki after loading');

    return html`
      <div class="app-drawer">
        <div
          class="app-topbar"
          style=${styleMap({
            borderColor: this.color(),
          })}
        >
          <div class="breadcrum-container">${this.renderBreadcrumb()}</div>
          <div class="login-widget-container">${this.renderLoginWidget()}</div>
        </div>

        <wiki-drawer-content
          id="wiki-drawer-content"
          uref=${this.uref}
          editable
          color=${this.color()}
          .eveesInfoConfig=${this.eveesInfoConfig}
        >
        </wiki-drawer-content>
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica,
            'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji',
            'Segoe UI Symbol';
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
        evees-info-user-based {
          width: 100%;
        }
        .login-widget-container {
          flex: 0 0 0;
          padding: 16px;
          display: flex;
        }
        .reload-button {
          margin-right: 8px;
        }
        .back-button {
          margin-right: 8px;
        }
      `,
    ];
  }
}
