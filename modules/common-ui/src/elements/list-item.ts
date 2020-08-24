import { LitElement, html, css, property } from 'lit-element';

export class UprtclListItem extends LitElement {
  render() {
    return html`<slot></slot>`;
  }

  static get styles() {
    return [
      css`
        :host {
          display: flex;
          height: 48px;
          flex-direction: column;
          justify-content: center;
          cursor: pointer;
        }
        :host(:hover) {
          background: #e8e8e8;
        }
      `,
    ];
  }
}
