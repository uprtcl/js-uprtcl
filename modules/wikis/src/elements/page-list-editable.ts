import { html, property } from 'lit-element';
import { EditableCase, EveesBaseEditable } from '@uprtcl/evees-ui';
import { TextNode, TextType } from '@uprtcl/documents';

import { Wiki } from '../types';
import { SELECT_PAGE_EVENT_NAME } from './wiki.editable';

export const REMOVE_PAGE_EVENT_NAME = 'remove-page';

export class PageListEditable extends EveesBaseEditable<Wiki> {
  @property({ type: Boolean })
  editable: boolean = false;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener<any>(REMOVE_PAGE_EVENT_NAME, (e: CustomEvent) => {
      this.removePage(e.detail.uref);
    });
  }

  async checkoutDraft() {
    await super.checkoutDraft(false);

    if (!this.mineId) throw new Error('mineId not defined');

    if (!this.data) {
      // initialize draft
      const init: Wiki = {
        title: '',
        pages: [],
      };
      await this.evees.updatePerspectiveData({
        perspectiveId: this.mineId,
        object: init,
        flush: { autoflush: true, debounce: 0 },
      });
    }
  }

  async checkoutOfficial() {
    await super.seeOfficial();
  }

  caseUpdated(oldCase: EditableCase) {
    // this.dispatchSelect(undefined);
  }

  dispatchSelect(uref: string | undefined) {
    this.dispatchEvent(
      new CustomEvent(SELECT_PAGE_EVENT_NAME, { bubbles: true, composed: true, detail: { uref } })
    );
  }

  async addPage() {
    if (!this.mineId) throw new Error('mineId not defined');

    const page: TextNode = {
      text: '',
      type: TextType.Title,
      links: [],
    };
    const ix = this.data ? this.data.object.pages.length : 0;
    const childId = await this.evees.addNewChild(this.mineId, page, ix);

    this.dispatchSelect(childId);

    await this.evees.client.flush();
  }

  async removePage(uref: string) {
    const ix = this.data ? this.data.object.pages.findIndex((id) => id === uref) : -1;
    if (ix === -1) {
      throw new Error(`Page ${uref} to be removed not found`);
    }

    await this.evees.removeChild(this.uref, ix);

    await this.evees.client.flush();
  }

  render() {
    console.log('render()');
    if (this.loading) return html`<uprtcl-loading></uprtcl-loading>`;

    const pages = this.data ? this.data.object.pages : [];

    return html` <div>
        ${this.renderInfo()}
        ${pages.map((page) => html`<page-list-item uref=${page}></page-list-item>`)}
      </div>
      ${this.isDraft()
        ? html`<uprtcl-button @click=${() => this.addPage()}>new page</uprtcl-button>`
        : ''}`;
  }
}
