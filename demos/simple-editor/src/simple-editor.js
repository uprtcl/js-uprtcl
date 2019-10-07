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

  async firstUpdated() {
    if (window.location.href.includes('?id=')) {
      this.rootHash = window.location.href.split('id=')[1];
    } else {
      const hashed = await this.textNodePattern.create();
      const perspective = await this.perspectivePattern.create({ dataId: hashed.id });
      this.rootHash = perspective.id;
    }
  }

  render() {
    return html`
      ${this.rootHash
        ? html`
            <cortex-pattern .hash=${this.rootHash}></cortex-pattern>
          `
        : html`
            Loading...
          `}
    `;
  }
}
