import { LitElement, property, html, css } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
// import { styleMap } from 'lit-html/directives/style-map';
// https://github.com/Polymer/lit-html/issues/729
export const styleMap = (style) => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, (matches) => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

export class WikiHome extends moduleConnect(LitElement) {
  @property({ type: String })
  wikiHash!: string;

  @property({ type: String })
  title!: string;

  @property({ type: String })
  color!: string;

  render() {
    return html`
      <div class="page-container">
        <div class="evee-info">
          <slot name="evee-page"></slot>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .page-container {
        text-align: center;
        height: auto;
        min-height: 100%;
      }

      .evee-info {
        margin-top: 4vw;
      }

      .row {
        display: flex;
        flex-direction: column;
      }

      .title {
        margin: 5vw 0px 5vw;
        font-weight: bold;
        color: #929a9e;
      }

      .color-bar {
        height: 1vw;
        max-height: 5px;
        width: 100%;
        margin-bottom: 1vw;
      }
    `;
  }
}
