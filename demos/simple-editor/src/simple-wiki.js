import { LitElement, html } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesTypes } from '@uprtcl/evees';
import { WikisTypes } from '@uprtcl/wikis';

export class SimpleWiki extends moduleConnect(LitElement) {
  static get properties() {
    return {
      rootHash: { type: String }
    };
  }

  constructor() {
    super();
    this.wikiPattern = this.request(WikisTypes.WikiPattern);
    this.perspectivePattern = this.request(EveesTypes.PerspectivePattern);
    this.wikisProvider = null;
    this.eveesProvider = null;
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
    this.wikisProvider = this.requestAll(WikisTypes.WikisRemote)
    .find(provider => {
      const regexp = new RegExp('^http');
      return regexp.test(provider.service.uprtclProviderLocator);
    });

    this.eveesProvider = this.requestAll(EveesTypes.EveesRemote)
    .find(provider => {
      const regexp = new RegExp('^http');
      return regexp.test(provider.service.uprtclProviderLocator);
    });


    window.addEventListener('popstate', () => {
      this.rootHash = window.location.href.split('id=')[1];
    });
    this.subscribeToHistory(window.history, state => {
      this.rootHash = state[2].split('id=')[1];
    });

    if (window.location.href.includes('?id=')) {
      this.rootHash = window.location.href.split('id=')[1];
    } else {
      const wiki = await this.wikiPattern.create(
        { title: 'Genesis Wiki' },
        this.wikisProvider.service.uprtclProviderLocator
      );
      const perspective = await this.perspectivePattern.create(
        { dataId: wiki.id },
        this.eveesProvider.service.uprtclProviderLocator
      );
      console.log(perspective.id)
      window.history.pushState('', '', `/?id=${perspective.id}`);
    }
  }

  render() {
    return html`
      ${this.rootHash
        ? html`
            <cortex-entity .hash=${this.rootHash}></cortex-entity>
          `
        : html`
            Loading...
          `}
    `;
  }
}
