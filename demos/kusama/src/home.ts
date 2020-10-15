import { LitElement, html, css, property, query } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';

export class Home extends moduleConnect(LitElement) {

  async firstUpdated() {
  }

  render() {
    return html`
      <button>Council Space</button>
      <button>Your Space</button>
    `;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      text-align: center;
      height: 80vh;
      padding: 10vh 10px;
    }
  `;
}
