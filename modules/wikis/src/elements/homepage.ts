import { LitElement, property, html } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

export class Homepage extends moduleConnect(LitElement) {
  @property({ type: String })
  wikiHash!: string;

  @property({ type: String })
  title!: string;

  
  recentPerspectives() {
    return html`
      <h2> Welcome to ${this.title} </h2>

      <h4> Recent new perspectives </h4>
      <evee-perspectives-list .rootPerspectiveId=${this.wikiHash}></evee-perspectives-list>
    `;
  }

  render() {
    return html`
      ${this.recentPerspectives()}
    `;
  }
}
