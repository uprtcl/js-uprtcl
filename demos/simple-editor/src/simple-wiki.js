import { LitElement, html, css } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesModule, createPerspective, createEntity, createCommit } from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';

export class SimpleWiki extends moduleConnect(LitElement) {
  static get properties() {
    return {
      rootHash: { type: String },
      loading: { type: Boolean, attribute: false },
      defaultAuthority: { type: String }
    };
  }

  constructor() {
    super();
    this.loading = true;
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

  async firstUpdated() {
    this.addEventListener('evees-proposal-created', e => console.log(e));

    window.addEventListener('popstate', () => {
      this.rootHash = window.location.href.split('id=')[1];
    });

    this.subscribeToHistory(window.history, state => {
      this.rootHash = state[2].split('id=')[1];
    });

    const eveesHttpProvider = this.requestAll(EveesModule.bindings.EveesRemote).find(provider =>
      provider.authority.startsWith('http')
    );

    await eveesHttpProvider.connect();

    this.defaultAuthority = eveesHttpProvider.authority;

    if (window.location.href.includes('?id=')) {
      this.rootHash = window.location.href.split('id=')[1];
    } else {
      const eveesEthProvider = this.requestAll(EveesModule.bindings.EveesRemote).find(provider =>
        provider.authority.startsWith('eth')
      );

      debugger

      const client = this.request(ApolloClientModule.bindings.Client);

      const wiki = {
        title: 'Genesis Wiki',
        pages: []
      };
      
      const dataId = await createEntity(client, eveesEthProvider, wiki);
      const headId = await createCommit(client, eveesEthProvider, { dataId });

      const randint = 0 + Math.floor((10000 - 0) * Math.random());
      const perspectiveId = await createPerspective(client, eveesEthProvider, { 
        headId, 
        context: `genesis-dao-wiki-${randint}`, 
        canWrite: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
      });

      window.history.pushState('', '', `/?id=${perspectiveId}`);
    }

    this.loading = false;
  }

  render() {
    return html`
      ${!this.loading
        ? html`
            <div class="app-mock">
              <wiki-drawer
                ref=${this.rootHash}
                default-authority=${this.defaultAuthority}
              ></wiki-drawer>
            </div>
          `
        : html`
            Loading...
          `}
    `;
  }

  static get styles() {
    return css`
      .app-mock {
        padding: 50px 80px;
        min-height: calc(100vh - 100px);
        display: flex;
        flex-direction: column;
        /* background-color: #bdc6e0; */
      }
    `;
  }
}
