import { LitElement, property, html } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { LensElement } from '@uprtcl/lenses';
import { EveesTypes } from '@uprtcl/evees';
import { DocumentsTypes } from '@uprtcl/documents'

import { WikiNode } from '../types';

export class WikiNodeLens extends moduleConnect(LitElement) implements LensElement<WikiNode> {
  @property({ type: Object })
  data!: WikiNode;

  @property({ type: String })
  rootHash!: String

  createPage = async () => {
    const perspectivePattern:any = this.request(EveesTypes.PerspectivePattern);
    const pagePattern:any = this.request(DocumentsTypes.TextNodePattern);

    const eveesProvider : any = this.requestAll(EveesTypes.EveesRemote)
    .find((provider:any) => {
      const regexp = new RegExp('^http');
      return regexp.test(provider.service.uprtclProviderLocator);
    });

    const pagesProvider : any = this.requestAll(DocumentsTypes.DocumentsRemote)
    .find((provider:any) => {
      const regexp = new RegExp('^http');
      return regexp.test(provider.service.uprtclProviderLocator);
    });

    const pageHash = await pagePattern.create(
      {},
      pagesProvider.service.uprtclProviderLocator
    );

    const perspective = await perspectivePattern.create(
      { dataId: pageHash.id },
      eveesProvider.service.uprtclProviderLocator
    );

    this.data.pages.push(perspective.id)
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

  setPage(pageHash) {
    this.rootHash = pageHash
  }

  render() {
    return html`
      <h4>${this.data.title}</h4>
      <ul>
        ${this.data.pages.map(page => {
          return html`
            <li @click=${() => this.setPage(page)}>${page}</li>
          `;
        })}
      </ul>

      <mwc-button @click=${() => this.createPage()}>
        <mwc-icon>note_add</mwc-icon>
        new page
      </mwc-button>


      ${this.rootHash
        ? html`
            <cortex-entity .hash=${this.rootHash}></cortex-entity>
          `
        : html`
            Loading...
          `}
    `;
  }
}
