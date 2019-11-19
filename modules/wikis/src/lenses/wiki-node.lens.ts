import { LitElement, property, html } from 'lit-element';

import { LensElement } from '@uprtcl/lenses';

import { WikiNode } from '../types';

export class WikiNodeLens extends LitElement implements LensElement<WikiNode> {
  @property({ type: Object })
  data!: WikiNode;

  connectedCallback() {
    super.connectedCallback()
    this.addEventListener('new-page', e => {
      e.stopPropagation();
      this.newPage(e)
    })
  }

  newPage = (e) => {
    console.log(e)
    console.log(e.srcElement)
    console.log(e.toElement)
    // const newPageHash = e.target['createPage']()
    this.data.pages.push(e.detail)
    this.updateContent(this.data.pages)
  }

  updateContent(pages: Array<string>) {
    this.dispatchEvent(
      new CustomEvent('content-changed', {
        detail: { newContent: { ...this.data, pages } },
        bubbles: true,
        composed: true
      })
    );
  }



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
      <mwc-button @click={${(e) => this.newPage(e)}}>
        <mwc-icon>note_add</mwc-icon>
        new page
      </mwc-button>
    `;
  }
}
