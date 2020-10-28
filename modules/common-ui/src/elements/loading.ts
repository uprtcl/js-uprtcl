import { LitElement, html, css } from 'lit-element';
import { icons } from './icons';

export class UprtclLoading extends LitElement {
  render() {
    return html`
      <div class="container">${icons.loading}<br /><slot></slot></div>
    `;
  }

  static get styles() {
    return [
      css`
        .container {
          height: var(--height, 40px);
          text-align: center;
        }
        svg {
          height: 100%;
          fill: var(--fill, #50b0ff);
        }
      `
    ];
  }
}
