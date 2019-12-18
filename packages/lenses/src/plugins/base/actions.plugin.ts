import { html } from 'lit-element';

import { Hashed } from '@uprtcl/cortex';

import { SlotPlugin } from '../slot.plugin';

export class ActionsPlugin implements SlotPlugin {
  renderSlot(entity: Hashed<any>) {
    return html`
      <cortex-actions .hash=${entity.id} toolbar="none"></cortex-actions>
    `;
  }
}
