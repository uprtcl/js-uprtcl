import { LitElement, property, html } from 'lit-element';

import { LensElement } from '@uprtcl/lenses';

import { WikiNode } from '../types';

export class WikiNodeLens extends LitElement implements LensElement<WikiNode> {
  @property({ type: Object })
  data!: WikiNode;

  render() {
    return html`
      <h1>${this.data.title}</h1>
      <div class="pages list">
          ${this.data.pages.map((page) => {
              html`i'm a page!`
          })}
      </div>
    `;
  }
}
