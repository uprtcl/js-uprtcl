import { LitElement, property, html } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

export class WikiHome extends moduleConnect(LitElement) {
  @property({ type: String })
  wikiHash!: string;

  @property({ type: String })
  title!: string;

  
  recentPerspectives() {
    return html`
      <h2> Welcome to ${this.title} </h2>

      <h4> Recent new perspectives </h4>
      <evees-perspectives-list perspective-id="${this.wikiHash}"></evees-perspectives-list>
    `;
  }

  render() {
    return html`
      ${this.recentPerspectives()}
    `;
  }
}
