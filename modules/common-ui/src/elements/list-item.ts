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
          transition: background-color 200ms linear;
        }
        :host(:hover) {
          background: #f1f1f1;
        }
      `,
    ];
  }
}
