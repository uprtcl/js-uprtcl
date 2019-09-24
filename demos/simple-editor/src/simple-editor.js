import { LitElement, html } from 'lit-element';

export const SimpleEditor = patternRegistry =>
  class extends LitElement {
    static get properties() {
      return {
        rootHash: { type: String }
      };
    }

    async firstUpdated() {
      if (window.location.href.includes('?id=')) {
        this.rootHash = window.location.href.split('id=')[1];
      } else {
        const hashed = await patternRegistry.getPattern('text-node').create();
        const commit = await patternRegistry
          .getPattern('commit')
          .create({ dataId: hashed.id, message: '', parentsIds: [] });
        const perspective = await patternRegistry
          .getPattern('perspective')
          .create({ headId: commit.id });
        this.rootHash = perspective.id;
      }
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
  };
