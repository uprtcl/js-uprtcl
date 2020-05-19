import { LitElement, property, html, css, query } from 'lit-element';

export class EveesLoadingButton extends LitElement {
  @property({ type: String })
  loading: string = 'true';

  @property({ type: String })
  label: string = '';

  @property({ type: String })
  icon: string = '';

  render() {
    return html` <mwc-button outlined icon=${this.loading === 'true' ? '' : this.icon}>
      ${this.loading === 'true'
        ? html`<cortex-loading-placeholder size="20"></cortex-loading-placeholder>`
        : this.label}
    </mwc-button>`;
  }

  static get styles() {
    return css`
      mwc-button {
        width: 220px;
      }
    `;
  }
}
