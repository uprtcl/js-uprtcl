import { LitElement, html, css } from 'lit-element';
import { cssFramework } from './miligram.css';

export class UprtclButton extends LitElement {
  render() {
    return html`<div class="button"><slot></slot></div>`;
  }

  static get styles() {
    return [
      cssFramework,
      css`
        :host {
          display: block;
        }
        .button {
          width: calc(100% - 6rem - 0.2rem);
        }
      `,
    ];
  }
}
