import { LitElement, property, html, css } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

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
        <div class="title">Welcome to ${this.title}</div>
        <div class="evee-info">
          <slot name="evee"></slot>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .page-container {
      }

      .row {
        display: flex;
        flex-direction: column;
      }

      .title {
        margin: 22px 0px 36px 16px;
        font-size: 32px;
        font-weight: bold;
      }

      .evee-info {
        height: 40px;
      }
    `;
  }
}
