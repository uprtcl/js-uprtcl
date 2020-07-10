import { LitElement, property, html, query, css } from 'lit-element';
const styleMap = (style) => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(
      /([A-Z])/g,
      (matches) => `-${matches[0].toLowerCase()}`
    );
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

export class ProgressBar extends LitElement {
  @property({ type: Number })
  progress!: number;

  async firstUpdated() {}

  render() {
    return html`
      <div class="external-box">
        <div
          class="internal-box"
          style=${styleMap({
            width: `${this.progress}%`,
          })}
        ></div>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .external-box {
        width: 100%;
        height: 100%;
        background-color: #cccccc;
        border-radius: 5px;
        overflow: hidden;
      }
      .internal-box {
        height: 100%;
        background-color: #3f51b5;
      }
    `;
  }
}
