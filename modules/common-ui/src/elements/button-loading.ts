import { LitElement, property, html, css, query } from 'lit-element';

export class UprtclButtonLoading extends LitElement {
  @property({ type: String })
  loading: string = 'true';

  @property({ type: Boolean })
  outlined: boolean = false;

  @property({ type: String })
  icon: string = '';

  render() {
    return html` <uprtcl-button
      ?outlined=${this.outlined}
      icon=${this.loading === 'true' ? '' : this.icon}
    >
      ${this.loading === 'true'
        ? html`<uprtcl-loading size="20"></uprtcl-loading>`
        : html`<slot></slot>`}
    </uprtcl-button>`;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: fit-content;
      }
    `;
  }
}
