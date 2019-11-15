import { LitElement, property, html } from 'lit-element';

import { LensElement } from '@uprtcl/lenses';

import { WikiNode } from '../types';

export class WikiNodeLens extends LitElement implements LensElement<WikiNode> {
  @property({ type: Object })
  data!: WikiNode;

  render() {
    return html`
      <h1>${this.data.title}</h1>
      <ul>
        ${this.data.pages.map((page) => {
            return html`
            <li>i'm a page!</li>
            `
        })}
      </ul>
    `;
  }
}
