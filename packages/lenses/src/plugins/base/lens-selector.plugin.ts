import { html } from 'lit-element';

import { Hashed } from '@uprtcl/cortex';

import { SlotPlugin } from '../slot.plugin';

export class LensSelectorPlugin implements SlotPlugin {
  renderSlot(entity: Hashed<any>) {
    return html`
      <cortex-lens-selector .hash=${entity.id}></cortex-lens-selector>
    `;
  }
}
