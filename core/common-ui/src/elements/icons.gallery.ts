import { LitElement, html, css } from 'lit-element';
import { icons } from './icons';

export class UprtclIconsGallery extends LitElement {
  render() {
    return Object.getOwnPropertyNames(icons).map((name) => {
      return html`<div class="icon-container">${icons[name]} ${name}</div>`;
    });
  }

  static get styles() {
    return [
      css`
        :host {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }

        .icon-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          border-radius: 6px;
          background-color: #e2e2e2;
          padding: 1rem;
        }

        svg {
          height: 40px;
          width: 40px;
          margin: 1rem;
        }
      `,
    ];
  }
}
