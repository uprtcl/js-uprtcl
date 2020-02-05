import { LitElement, html, property } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesModule, CREATE_COMMIT, CREATE_PERSPECTIVE } from '@uprtcl/evees';
import { WikisModule, CREATE_WIKI } from '@uprtcl/wikis';
import { CHANGE_OWNER } from '@uprtcl/access-control';
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
    this.addEventListener('evees-proposal-created', e => console.log(e));

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
      const createWiki = await client.mutate({
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
          dataId: createWiki.data.createWiki.id,
          parentsIds: [],
          source: this.eveesProvider.source
        }
      });

      const createPerspective = await client.mutate({
        mutation: CREATE_PERSPECTIVE,
        variables: {
          headId: createCommit.data.createCommit.id,
          authority: this.eveesProvider.authority,
          name: 'master'
        }
      });

      const perspectiveId = createPerspective.data.createPerspective.id;

      /** transfer ownership to the DAO */
      const changeOwner = await client.mutate({
        mutation: CHANGE_OWNER,
        variables: {
          entityId: perspectiveId,
          newOwner: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
        }
      });

      window.history.pushState('', '', `/?id=${perspectiveId}`);
    }

    this.loading = false;
  }

  render() {
    return html`
      ${!this.loading
        ? html`
            <cortex-entity hash=${this.rootHash}></cortex-entity>
          `
        : html`
            Loading...
          `}
    `;
  }
}
