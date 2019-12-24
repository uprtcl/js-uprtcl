import { LitElement, html } from 'lit-element';
import '@authentic/mwc-circular-progress';

export class CortexLoadingPlaceholder extends LitElement {
  render() {
    return html`
      <div style="flex: 1; justify-content: center; align-items: center;">
        <mwc-circular-progress></mwc-circular-progress>
      </div>
    `;
  }
}
