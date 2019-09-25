import { LitElement, property, html, customElement } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { Lens } from '../types';

@customElement('lens-renderer')
export class LensRenderer extends LitElement {
  @property({ type: Object })
  lens!: Lens;

  @property()
  data!: object;

  render() {
    const lensTag = this.lens.lens;
    return html`
      ${unsafeHTML(`
        <${lensTag} .data=${this.data}>
        </${lensTag}>
      `)}
    `;
  }
}
