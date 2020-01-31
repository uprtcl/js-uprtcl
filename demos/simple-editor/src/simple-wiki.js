import { LitElement, html, property } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesModule, CREATE_COMMIT, CREATE_PERSPECTIVE } from '@uprtcl/evees';
import { WikisModule, CREATE_WIKI } from '@uprtcl/wikis';
import { DocumentsModule } from '@uprtcl/documents';

export class SimpleWiki extends moduleConnect(LitElement) {
  static get properties() {
    return {
      rootHash: { type: String },
      loading: { type: Boolean, attribute: false }
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
    this.addEventListener('evees-request-created', e => console.log(e));

    this.wikisProvider = this.requestAll(WikisModule.bindings.WikisRemote).find(provider => provider.source.startsWith('ipfs'));

    this.docsProvider = this.requestAll(DocumentsModule.bindings.DocumentsRemote).find(provider => provider.source.startsWith('ipfs'));

    this.eveesProvider = this.requestAll(EveesModule.bindings.EveesRemote).find(provider =>  provider.authority.startsWith('eth'));

    window.addEventListener('popstate', () => {
      this.rootHash = window.location.href.split('id=')[1];
    });

    this.subscribeToHistory(window.history, state => {
      this.rootHash = state[2].split('id=')[1];
    });

    if (window.location.href.includes('?id=')) {
      this.rootHash = window.location.href.split('id=')[1];
    } else {
      const client = this.request(ApolloClientModule.bindings.Client);
      const result = await client.mutate({
        mutation: CREATE_WIKI,
        variables: {
          content: {
            title: 'Genesis Wiki',
            pages: []
          },
          source: this.wikisProvider.source
        }
      });

      const createCommit = await client.mutate({
        mutation: CREATE_COMMIT,
        variables: {
          dataId: result.data.createWiki.id,
          parentsIds: [],
          source: this.eveesProvider.source
        }
      });

      const createPerspective = await client.mutate({
        mutation: CREATE_PERSPECTIVE,
        variables: {
          headId: createCommit.data.createCommit.id,
          authority: this.eveesProvider.authority
        }
      });

      window.history.pushState('', '', `/?id=${createPerspective.data.createPerspective.id}`);
    }

    this.loading = false;
  }

  render() {
    return html`
      ${!this.loading
        ? html`
            <wiki-drawer @evees- wiki-id=${this.rootHash}></wiki-drawer>
          `
        : html`
            Loading...
          `}
    `;
  }
}
