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
    const wikisProvider = this.requestAll(WikisTypes.WikisRemote)
    .find(provider => {
      console.log(provider)
      const regexp = new RegExp('^http');
      console.log(regexp.test(provider.service.uprtclProviderLocator))
      return regexp.test(provider.service.uprtclProviderLocator);
    });
    console.log(wikisProvider)

    const eveesProvider = this.requestAll(EveesTypes.EveesRemote)
    .find(provider => {
      console.log(provider)
      const regexp = new RegExp('^http');
      console.log(regexp.test(provider.service.uprtclProviderLocator))
      return regexp.test(provider.service.uprtclProviderLocator);
    });
    console.log(eveesProvider)

    window.addEventListener('popstate', () => {
      this.rootHash = window.location.href.split('id=')[1];
    });
    this.subscribeToHistory(window.history, state => {
      this.rootHash = state[2].split('id=')[1];
    });

    if (window.location.href.includes('?id=')) {
      this.rootHash = window.location.href.split('id=')[1];
    } else {
      const hashed = await this.wikiPattern.create(
        { title: 'this is a test wiki', },
        wikisProvider.service.uprtclProviderLocator
      );

      const perspective = await this.perspectivePattern.create(
        { dataId: hashed.id },
        eveesProvider.service.uprtclProviderLocator
      );
      console.log(perspective.id)
      window.history.pushState('', '', `/?id=${perspective.id}`);
    }
    document.getElementById('');
  }

  render() {
    return html`
      ${this.rootHash
        ? html`
            <cortex-entity .hash=${this.rootHash}></cortex-entity>\
          `
        : html`
            Loading...
          `}
    `;
  }
}
