import { LitElement, html, css, property } from 'lit-element';
import { cssFramework } from './miligram.css';
import { icons } from './icons';

export class UprtclButton extends LitElement {
  @property({ type: String })
  icon!: string;

  render() {
    return html` <div class="button">
      ${this.icon !== undefined
        ? html`<div class="icon-container">${icons[this.icon]}</div>`
        : ''}<slot></slot>
    </div>`;
  }

  static get styles() {
    return [
      cssFramework,
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
      `,
    ];
  }
}
