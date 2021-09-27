import { LitElement, html, css } from 'lit-element';

export class UprtclSelect extends LitElement {
  render() {
    return html`<select
      ><slot></slot
    ></select>`;
  }

  static get styles() {
    return [css``];
  }
}
