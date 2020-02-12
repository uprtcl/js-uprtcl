import { LitElement, html, property } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesModule, EveesBindings } from '@uprtcl/evees';
import { WikisModule, WikiBindings } from '@uprtcl/wikis';
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

    this.wikisProvider = this.requestAll(WikisModule.bindings.WikisRemote).find(provider =>
      provider.source.startsWith('ipfs')
    );

    this.docsProvider = this.requestAll(DocumentsModule.bindings.DocumentsRemote).find(provider =>
      provider.source.startsWith('ipfs')
    );

    this.eveesProvider = this.requestAll(EveesModule.bindings.EveesRemote).find(provider =>
      provider.authority.startsWith('eth')
    );

    window.addEventListener('popstate', () => {
      this.rootHash = window.location.href.split('id=')[1];
    });

    this.subscribeToHistory(window.history, state => {
      this.rootHash = state[2].split('id=')[1];
    });

    if (window.location.href.includes('?id=')) {
      this.rootHash = window.location.href.split('id=')[1];
    } else {
      const wikipatterns = this.requestAll(WikiBindings.WikiEntity);
      const wikicreatable = wikipatterns.find(p => p.create);
      const wiki = await wikicreatable.create()(
        {
          title: 'Genesis Wiki',
          pages: []
        },
        this.wikisProvider.source
      );

      const commitpatterns = this.requestAll(EveesBindings.CommitPattern);
      const commitcreatable = commitpatterns.find(p => p.create);
      const commit = await commitcreatable.create()(
        {
          dataId: wiki.id,
          parentsIds: [],
          message: 'create'
        },
        this.eveesProvider.source
      );

      const randint = 0 + Math.floor((10000 - 0) * Math.random());

      const perspectivepatterns = this.requestAll(EveesBindings.PerspectivePattern);
      const perspectivecreatable = perspectivepatterns.find(p => p.create);
      const perspective = await perspectivecreatable.create()(
        {
          fromDetails: {
            headId: commit.id,
            context: `genesis-dao-wiki-${randint}`,
            name: 'common'
          },
          canWrite: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'
        },
        this.eveesProvider.authority
      );

      const perspectiveId = perspective.id;

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
