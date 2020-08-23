import { LitElement, html, css, property } from 'lit-element';

export class UprtclTextField extends LitElement {
  @property({ type: String })
  label: string = '';

  @property({ type: String })
  value: string = '';

  render() {
    return html`<label>${this.label}</label
      ><input
        value=${this.value}
        @input=${(e) => (this.value = e.target.value)}
      />`;
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
