import { LitElement, html, css, property } from 'lit-element';

export class UprtclCard extends LitElement {
  render() {
    return html`<slot></slot>`;
  }

  static get styles() {
    return [
      css`
        :host {
          background-color: white;
          box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
      `,
    ];
  }
}
