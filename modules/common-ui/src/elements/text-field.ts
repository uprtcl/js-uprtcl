import { LitElement, html, css, property, query } from 'lit-element';

export class UprtclTextField extends LitElement {
  @property({ type: String })
  label: string = 'label';

  @property({ type: String })
  value: string = '';

  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ attribute: false })
  focused: boolean = false;

  @query('#input-element')
  inputEl!: HTMLInputElement;

  focus() {
    if (!this.inputEl) return;
    this.inputEl.focus();
  }

  render() {
    return html`<div class="container">
      ${this.focused ? html`<div class="label">${this.label}</div>` : ''}
      <div class="input-container">
        <input
          ?disabled=${this.disabled}
          id="input-element"
          value=${this.value}
          @focus=${() => (this.focused = true)}
          @blur=${() => (this.focused = false)}
          @input=${(e) => (this.value = e.target.value)}
          placeholder=${this.focused ? '' : this.label}
        />
      </div>
    </div>`;
  }

  static get styles() {
    return [
      css`
        :host {
          width: fit-content;
        }
        .container {
          position: relative;
        }
        .label {
          width: 100%;
          position: absolute;
          left: 10px;
          top: -8px;
          background-color: white;
          width: fit-content;
          padding: 0px 5px;
          font-size: 15px;
          color: #2196f3;
        }
        input {
          padding-top: 8px;
          padding-bottom: 8px;
          padding-left: 16px;
          padding-right: 16px;
          height: 30px;
          font-family: Roboto, sans-serif;
          font-size: 16px;
          font-stretch: 100%;
          outline-style: none;
          border-style: none;
          border-radius: 4px;
        }
        .input-container {
          caret-color: #2196f3;
          border-color: #2196f3 !important;
          border-radius: 4px;
          border-style: solid;
          border-width: 2px;
          width: fit-content;
        }
      `,
    ];
  }
}
