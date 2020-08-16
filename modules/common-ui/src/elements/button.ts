import { LitElement, html, css, property } from 'lit-element';
import { styles } from './styles.css';
import { icons } from './icons';

export class UprtclButton extends LitElement {
  @property({ type: String })
  icon!: string;

  render() {
    return html` <div class="button button-colored">
      ${this.icon !== undefined
        ? html`<div class="icon-container">${icons[this.icon]}</div>`
        : ''}<slot></slot>
    </div>`;
  }

  static get styles() {
    return [
      styles,
      css`
        svg {
          fill: white;
        }
        .icon-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-right: 10px;
        }
        .button {
          display: flex;
          flex-direction: row;
          justify-content: center;
          width: calc(100% - 6rem - 0.2rem);
        }
        .button-colored {
          background-color: #2286c3;
          border-color: #2286c3;
        }
        .button-colored.button-clear,
        .button-colored.button-outline {
          background-color: transparent;
          color: #2286c3;
        }
        .button-colored.button-clear {
          border-color: transparent;
        }
      `,
    ];
  }
}
