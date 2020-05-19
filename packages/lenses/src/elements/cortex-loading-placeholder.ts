import { LitElement, html, css, property } from 'lit-element';
import '@authentic/mwc-circular-progress';

export class CortexLoadingPlaceholder extends LitElement {
  @property({ type: Number })
  size: number = 28;

  render() {
    return html`
      <div class="container">
        <mwc-circular-progress SIZE=${this.size}></mwc-circular-progress>
        <div>
          <slot></slot>
        </div>
      </div>
    `;
  }

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
}
