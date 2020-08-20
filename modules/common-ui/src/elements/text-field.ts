import { LitElement, html, css, property } from 'lit-element';

export class UprtclTextField extends LitElement {
  @property({ type: String })
  label: string = '';

  render() {
    return html`<label>${this.label}</label><input />`;
  }

  static get styles() {
    return [
      css`
        label {
          width: 100%;
        }
        input {
          width: 100%;
        }
      `,
    ];
  }
}
