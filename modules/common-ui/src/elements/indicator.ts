import { LitElement, html, css, property, query } from 'lit-element';

export class UprtclIndicator extends LitElement {
  @property({ type: String })
  label: string = '';

  @property({ type: String })
  value: string = '';

  render() {
    return html`
      <div class="container">
        ${this.label
          ? html`
              <div class="label">${this.label}</div>
            `
          : ''}
        <div class="input-container">
          <slot></slot>
        </div>
      </div>
    `;
  }

  static get styles() {
    return [
      css`
        :host {
          width: fit-content;
          display: flex;
          flex-direction: column;
        }
        .container {
          position: relative;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
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
        .input-container {
          border-color: #2196f3;
          border-radius: 4px;
          border-style: solid;
          border-width: 2px;
          width: calc(100% - 30px);
          min-height: 30px;
          min-width: 100px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 6px 12px;
          flex-grow: 1;
          text-align: center;
        }
      `
    ];
  }
}
