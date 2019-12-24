import { LitElement, html } from 'lit-element';
import '@authentic/mwc-circular-progress';

export class CortexLoadingPlaceholder extends LitElement {
  render() {
    return html`
      <mwc-circular-progress></mwc-circular-progress>
    `;
  }
}
