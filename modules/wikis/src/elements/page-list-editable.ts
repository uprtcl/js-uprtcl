import { html } from 'lit-element';
import { EveesBaseDraft } from '@uprtcl/evees';

import { Wiki } from '../types';

export class PageListEditable extends EveesBaseDraft<Wiki> {
  render() {
    if (this.loading) return html`<uprtcl-loading></uprtcl-loading>`;

    if (!this.data) throw new Error(`data undefined`);
    return html`${this.data.object.pages.map((page) => html`<page-item uref=${page}></page-item>`)}`;
  }
}
