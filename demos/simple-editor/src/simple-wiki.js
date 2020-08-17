import { LitElement, html, css } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesModule, EveesHelpers } from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';

export class SimpleWiki extends moduleConnect(LitElement) {
  static get properties() {
    return {
      rootHash: { type: String },
      loading: { type: Boolean, attribute: false },
      defaultRemoteId: { type: String },
    };
  }

  constructor() {
    super();
    this.loading = true;
  }

  subscribeToHistory(history, callback) {
    const pushState = history.pushState;
    history.pushState = function (state) {
      if (typeof history.onpushstate == 'function') {
        history.onpushstate({ state: state });
      }
      callback(arguments);
      // Call your custom function here
      return pushState.apply(history, arguments);
    };
  }

  async firstUpdated() {
    this.addEventListener('evees-proposal-created', (e) => console.log(e));

    window.addEventListener('popstate', () => {
      this.rootHash = window.location.href.split('id=')[1];
    });

    this.subscribeToHistory(window.history, (state) => {
      this.rootHash = state[2].split('id=')[1];
    });

    const defaultRemote = this.request(EveesModule.bindings.DefaultRemote);
    await defaultRemote.ready();

    this.defaultRemoteId = defaultRemote.id;

    // wait all remotes to be ready
    await Promise.all(
      this.requestAll(EveesModule.bindings.EveesRemote).map((remote) =>
        remote.ready()
      )
    );

    if (window.location.href.includes('?id=')) {
      this.rootHash = window.location.href.split('id=')[1];
    } else {
      const eveesEthRemote = this.requestAll(
        EveesModule.bindings.EveesRemote
      ).find((instance) => instance.id.startsWith('eth'));

      await eveesEthRemote.ready();

      const client = this.request(ApolloClientModule.bindings.Client);

      const randint = 0 + Math.floor((10000 - 0) * Math.random());
      const wiki = {
        title: `Genesis Wiki ${randint}`,
        pages: [],
      };

      const dataId = await EveesHelpers.createEntity(
        client,
        eveesEthRemote.store,
        wiki
      );
      const headId = await EveesHelpers.createCommit(
        client,
        eveesEthRemote.store,
        {
          dataId,
        }
      );

      const perspectiveId = await EveesHelpers.createPerspective(
        client,
        eveesEthRemote,
        {
          headId,
          context: `genesis-dao-wiki-${randint}`,
          canWrite: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
        }
      );

      window.history.pushState('', '', `/?id=${perspectiveId}`);
    }

    this.loading = false;
  }

  render() {
    return html`
      ${!this.loading
        ? html`
            <div class="app-header">HEADER</div>
            <div class="app-content">
              <div class="app-bar">BAR</div>
              <div class="wiki-container">
                <wiki-drawer
                  uref=${this.rootHash}
                  default-remote=${this.defaultRemoteId}
                  .editableRemotes=${[this.defaultRemoteId]}
                ></wiki-drawer>
              </div>
            </div>
          `
        : html` Loading... `}
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
        background-color: white;
      }
    `;
  }
}
