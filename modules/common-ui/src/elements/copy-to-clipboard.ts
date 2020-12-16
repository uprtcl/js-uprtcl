import { LitElement, html, css, property, query } from 'lit-element';
import { styles } from './styles.css';

export class UprtclCopyToClipboard extends LitElement {
  @property({ type: String })
  icon: string = 'content_copy';

  @property({ type: String })
  text!: string;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', (e: Event) => {
      e.stopPropagation();
    });
  }

  render() {
    return html`
      <clipboard-copy value=${this.text}
        ><uprtcl-icon-button
          icon="content_copy"
          button
          skinny
        ></uprtcl-icon-button
      ></clipboard-copy>
    `;
  }

  static get styles() {
    return [
      styles,
      css`
        input {
          display: none;
        }
      `,
    ];
  }
}
