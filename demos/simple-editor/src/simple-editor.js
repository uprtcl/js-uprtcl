import { LitElement, html } from 'lit-element';
import { RequestDependencyEvent } from '@uprtcl/micro-orchestrator';
import { UprtclTypes } from '@uprtcl/common';
import { DocumentsTypes } from '@uprtcl/documents';

export class SimpleEditor extends LitElement {
  static get properties() {
    return {
      rootHash: { type: String }
    };
  }

  async firstUpdated() {
    const e = this.dispatchEvent(
      new RequestDependencyEvent({
        detail: { request: [UprtclTypes.PerspectivePattern, DocumentsTypes.TextNodePattern] },
        composed: true,
        bubbles: true
      })
    );
    console.log(e);

    if (window.location.href.includes('?id=')) {
      this.rootHash = window.location.href.split('id=')[1];
    } else {
/*       const hashed = await e.dependencies[0].create();
      const commit = await patternRegistry
        .getPattern('commit')
        .create({ dataId: hashed.id, message: '', parentsIds: [] });
      const perspective = await patternRegistry
        .getPattern('perspective')
        .create({ headId: commit.id });
      this.rootHash = perspective.id;
 */    }
  }

  render() {
    return html`
      ${this.rootHash
        ? html`
            <pattern-renderer .hash=${this.rootHash}></pattern-renderer>
          `
        : html`
            Loading...
          `}
    `;
  }
}
