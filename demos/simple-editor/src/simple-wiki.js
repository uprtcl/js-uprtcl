import { LitElement, html, css } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesModule, EveesHelpers, deriveSecured, hashObject } from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';

import { env } from '../env';

export class SimpleWiki extends moduleConnect(LitElement) {
  static get properties() {
    return {
      rootHash: { type: String },
      loading: { attribute: false },
      canCreate: { attribute: false },
      creatingSpace: { attribute: false }
    };
  }

  constructor() {
    super();
    this.loading = true;
    this.officalRemote = undefined;
  }

  subscribeToHistory(history, callback) {
    const pushState = history.pushState;
    history.pushState = function(state) {
      if (typeof history.onpushstate == 'function') {
        history.onpushstate({ state: state });
      }
      callback(arguments);
      // Call your custom function here
      return pushState.apply(history, arguments);
    };
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('evees-proposal', e => {
      console.log('CATCHED EVENT: evees-proposal ', { e });
      e.stopPropagation();
    });
  }

  async firstUpdated() {
    this.loading = true;

    window.addEventListener('popstate', () => {
      this.rootHash = window.location.href.split('id=')[1];
    });

    this.subscribeToHistory(window.history, state => {
      this.rootHash = state[2].split('id=')[1];
    });

    this.officalRemote = this.requestAll(EveesModule.bindings.EveesRemote).find(instance =>
      instance.id.includes(env.officialRemote)
    );

    // wait all remotes to be ready
    await Promise.all(
      this.requestAll(EveesModule.bindings.EveesRemote).map(remote => remote.ready())
    );

    this.canCreate = await this.officalRemote.isLogged();

    if (window.location.href.includes('?id=')) {
      this.rootHash = window.location.href.split('id=')[1];
    }

    if (window.location.href.includes('remoteHome=')) {
      const remoteHome = this.officalRemote.getHome
        ? await this.officalRemote.getHome()
        : undefined;
      if (!remoteHome) throw new Error('home remote perspective not defined');
      await this.officalRemote.store.create(remoteHome.object);
      window.history.pushState('', '', `/?id=${remoteHome.id}`);
    }

    this.loading = false;
  }

  async login() {
    const remotes = this.requestAll(EveesModule.bindings.EveesRemote);
    await Promise.all(remotes.map(r => r.login()));
    this.canCreate = await this.officalRemote.isLogged();
  }

  async createSpace() {
    this.creatingSpace = true;

    await this.officalRemote.ready();

    const client = this.request(ApolloClientModule.bindings.Client);

    const randint = 0 + Math.floor((10000 - 0) * Math.random());
    const wiki = {
      title: `Genesis Wiki ${randint}`,
      pages: []
    };

    const dataId = await EveesHelpers.createEntity(client, this.officalRemote.store, wiki);
    const headId = await EveesHelpers.createCommit(client, this.officalRemote.store, {
      dataId
    });

    // TODO: handle insufficient funds error & cancelled tx
    const perspectiveId = await EveesHelpers.createPerspective(client, this.officalRemote, {
      headId,
      context: `my-wiki-${randint}`
    });
    this.creatingSpace = false;
    window.history.pushState('', '', `/?id=${perspectiveId}`);
  }

  renderCreate() {
    return html`
      <div class="home">
        ${this.canCreate
          ? html`
              <uprtcl-button-loading
                class="main-button"
                @click=${() => this.createSpace()}
                ?loading=${this.creatingSpace}
                >create space</uprtcl-button-loading
              >
            `
          : html`
              <uprtcl-button class="main-button" @click=${() => this.login()}
                >connect</uprtcl-button
              >
            `}
      </div>
    `;
  }

  renderWiki() {
    return html`
      <div class="wiki-container">
        <wiki-drawer uref=${this.rootHash} show-proposals check-owner></wiki-drawer>
      </div>
    `;
  }

  render() {
    return html`
      ${!this.loading
        ? html`
            <div class="app-header">HEADER</div>
            <div class="app-content">
              <div class="app-bar">BAR</div>
              ${this.rootHash === undefined ? this.renderCreate() : this.renderWiki()}
            </div>
          `
        : html`
            Loading...
          `}
    `;
  }

  static get styles() {
    return css`
      :host {
        height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: column;
      }
      .app-header {
        width: 100%;
        height: 50px;
        flex-shrink: 0;
        background-color: white;
      }
      .app-content {
        overflow: auto;
        flex-grow: 1;
        display: flex;
        flex-direction: row;
      }
      .home {
        height: calc(100vh - 50px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
      }
      .main-button {
        width: 220px;
      }
      wiki-drawer {
        min-height: calc(100vh - 50px);
      }
      .app-bar {
        width: 0vw;
        flex-grow: 0;
        flex-shrink: 0;
        background-color: #ceb19e;
      }
      .wiki-container {
        flex-grow: 1;
        max-width: 100%;
        background-color: white;
      }
    `;
  }
}
