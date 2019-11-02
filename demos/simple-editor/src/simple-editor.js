import { LitElement, html } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { UprtclTypes } from '@uprtcl/common';
import { DocumentsTypes } from '@uprtcl/documents';

export class SimpleEditor extends moduleConnect(LitElement) {
  static get properties() {
    return {
      rootHash: { type: String }
    };
  }

  constructor() {
    super();
    this.perspectivePattern = this.request(UprtclTypes.PerspectivePattern);
    this.textNodePattern = this.request(DocumentsTypes.TextNodePattern);
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
    window.addEventListener('popstate', () => {
      this.rootHash = window.location.href.split('id=')[1];
      console.log('ihi', this.rootHash);
    });
    this.subscribeToHistory(window.history, state => {
      console.log('ihi', state);
      this.rootHash = state[2].split('id=')[1];
    });

    if (window.location.href.includes('?id=')) {
      this.rootHash = window.location.href.split('id=')[1];
    } else {
      const hashed = await this.textNodePattern.create();

      const perspective = await this.perspectivePattern.create({ dataId: hashed.id });
      console.log('hi2');
      window.history.pushState('', '', `/?id=${perspective.id}`);
    }
    document.getElementById('')
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
