import { LitElement, property, html, css } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

export class WikiHome extends moduleConnect(LitElement) {
  @property({ type: String })
  wikiHash!: string;

  @property({ type: String })
  title!: string;

  recentPerspectives() {
    return html`
      <span class="title">Welcome to ${this.title}</span>

      <evees-perspectives-list perspective-id="${this.wikiHash}"></evees-perspectives-list>
    `;
  }

  render() {
    return html`
      <div style="padding: 36px" class="row">
        ${this.recentPerspectives()}
      </div>
    `;
  }

  static get styles() {
    return css`
      .row {
        display: flex;
        flex-direction: column;
      }

      .title {
        font-size: 20px;
        padding-bottom: 16px;
        font-weight: bold;
      }
    `;
  }
}
