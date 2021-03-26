import { LitElement, html, css, property, query } from 'lit-element';
import { icons } from './icons';
import { styles } from './styles.css';

export class UprtclCopyToClipboard extends LitElement {
  @property({ type: String })
  icon = 'content_copy';

  @property({ type: String })
  text!: string;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', (e: Event) => {
      e.stopPropagation();
    });
  }

  async copyShareURL() {
    try {
      await window.navigator.clipboard.writeText(`${this.text}`);
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    return html`
      <div class="action-copy-cont">
        <div class="url-cont">${this.text}</div>
        <div @click=${this.copyShareURL} class="copy-url-button clickable">${icons[this.icon]}</div>
      </div>
    `;
  }

  static get styles() {
    return [
      styles,
      css`
        .action-copy-cont {
          margin-top: 1rem;
          display: flex;

          /* Accent */

          background: #ecf1f4;
          /* Gray 5 */

          border: 1px solid #e0e0e0;
          box-sizing: border-box;
          /* Field/Inset */

          box-shadow: inset 0px 2px 2px -1px rgba(74, 74, 104, 0.1);
          border-radius: 0.5rem;
        }
        .url-cont {
          overflow-x: scroll;
          padding: 0 0.5rem;
          color: #4c4c5a;
          font-size: 0.9rem;
          display: flex;
          justify-content: start;
          align-items: center;
          margin: 0 0.25rem;
        }
        .url-cont::-webkit-scrollbar {
          height: 4px;
        }

        /* Track */
        .url-cont::-webkit-scrollbar-track {
          background: #f1f1f1;
          height: 4px;
        }

        /* Handle */
        .url-cont::-webkit-scrollbar-thumb {
          background: #ccc;
          height: 4px;
        }

        /* Handle on hover */
        .url-cont::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        .copy-url-button {
          background: var(--white, #fff);
          align-items: center;
          justify-content: center;
          display: flex;
          padding: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
      `,
    ];
  }
}
