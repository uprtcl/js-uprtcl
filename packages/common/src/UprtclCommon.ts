import { html, css, LitElement, property, customElement } from 'lit-element';

@customElement('uprtcl-common')
export class UprtclCommon extends LitElement {
  @property()
  title = 'Hello world!';

  static get styles() {
    return css`
      :host {
        background: grey;
        display: block;
        padding: 25px;
      }
    `;
  }

  render() {
    return html`
      <h2>${this.title}</h2>
      <div>
        <slot></slot>
      </div>
    `;
  }
}
