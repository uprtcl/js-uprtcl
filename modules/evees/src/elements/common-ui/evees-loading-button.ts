import { LitElement, property, html, css, query } from 'lit-element';

export class EveesLoadingButton extends LitElement {
  @property({ type: String })
  loading: string = 'true';

  @property({ type: String })
  label: string = '';

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
        ? html`<cortex-loading-placeholder
            size="20"
          ></cortex-loading-placeholder>`
        : this.label}
    </uprtcl-button>`;
  }

  static get styles() {
    return css`
      uprtcl-button {
        width: 220px;
      }
    `;
  }
}
