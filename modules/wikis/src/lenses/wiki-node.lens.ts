import { LitElement, property, html } from 'lit-element';

import { LensElement } from '@uprtcl/lenses';

import { WikiNode } from '../types';

export class WikiNodeLens extends LitElement implements LensElement<WikiNode> {
  @property({ type: Object })
  data!: WikiNode;

  render() {
    return html`
      <h4>${this.data.title}</h4>
      <ul>
        ${this.data.pages.map(page => {
          return html`
            <li>${page}</li>
          `;
        })}
      </ul>
      <mwc-button class=${'someclass'} @click=${() => console.log('creating new page..')}>
        <mwc-icon>new page</mwc-icon>
      </mwc-button>
    `;
  }
}
