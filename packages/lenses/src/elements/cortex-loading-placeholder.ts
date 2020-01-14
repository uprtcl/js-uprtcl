import { LitElement, html, css } from 'lit-element';
import '@authentic/mwc-circular-progress';

export class CortexLoadingPlaceholder extends LitElement {
  static get styles() {
    return css`
      .container {
        flex: 1;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `;
  }

  render() {
    return html`
      <div class="container">
        <mwc-circular-progress></mwc-circular-progress>
        <div>
          <slot></slot>
        </div>
      </div>
    `;
  }
}
