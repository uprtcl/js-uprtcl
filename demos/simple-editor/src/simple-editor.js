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
      } else {
        const hashed = await patternRegistry.getPattern('text-node').create();
        this.rootHash = hashed.id;
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
