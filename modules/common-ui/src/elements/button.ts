import { LitElement, html, css, property } from 'lit-element';
import { styles } from './styles.css';
import { icons } from './icons';

export class UprtclButton extends LitElement {
  @property({ type: String })
  icon!: string;

  render() {
    return html` <div class="button-color button-layout">
      ${this.icon !== undefined
        ? html`<div class="icon-container">${icons[this.icon]}</div>`
        : ''}

      <slot></slot>
    </div>`;
  }

  static get styles() {
    return [
      styles,
      css`
        .button-layout {
          border-radius: 0.5rem;
          display: flex;
          flex-direction: row;
          justify-content: center;
          line-height: 3.6rem;
          height: 3.6rem;
          padding: 0rem 3rem;
        }
        .icon-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-right: 10px;
        }
      `,
    ];
  }
}
