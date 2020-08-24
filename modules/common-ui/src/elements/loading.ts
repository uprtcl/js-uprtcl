import { LitElement, html, css } from 'lit-element';
import { icons } from './icons';

export class UprtclLoading extends LitElement {
  render() {
    return html`<div class="container">${icons.loading}</div>`;
  }

  static get styles() {
    return [
      css`
        .container {
          height: 40px;
        }
        svg {
          height: 100%;
        }
      `,
    ];
  }
}
