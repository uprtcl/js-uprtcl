import { html, property } from 'lit-element';
import { EveesBaseEditable } from '@uprtcl/evees';

import { Wiki } from '../types';
import { TextNode, TextType } from '@uprtcl/documents';

export class PageListEditable extends EveesBaseEditable<Wiki> {
  @property({ type: Boolean })
  editable: boolean = false;

  async checkoutDraft() {
    await super.checkoutDraft(false);

    if (!this.mineId) throw new Error('mineId not defined');

    if (!this.data) {
      // initialize draft
      const init: Wiki = {
        title: '',
        pages: [],
      };
      await this.evees.updatePerspectiveData(this.mineId, init);
      await this.evees.client.flush();
    }
  }

  async checkoutOfficial() {
    await super.seeOfficial();
  }

  async addPage() {
    if (!this.mineId) throw new Error('mineId not defined');

    const page: TextNode = {
      text: '',
      type: TextType.Title,
      links: [],
    };
    const childId = await this.evees.addNewChild(this.mineId, page);
    await this.evees.client.flush();

    this.dispatchEvent(
      new CustomEvent('select-page', { bubbles: true, composed: true, detail: { uref: childId } })
    );
  }

  render() {
    console.log('render()');
    if (this.loading) return html`<uprtcl-loading></uprtcl-loading>`;

    const pages = this.data ? this.data.object.pages : [];

    return html` <div>
        ${this.renderInfo()}
        ${pages.map((page) => html`<page-list-item uref=${page}></page-list-item>`)}
      </div>
      ${this.isDraft
        ? html`<uprtcl-button @click=${() => this.addPage()}>new page</uprtcl-button>`
        : ''}`;
  }
}
