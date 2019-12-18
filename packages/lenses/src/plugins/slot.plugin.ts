import { TemplateResult } from 'lit-element';

import { Hashed } from '@uprtcl/cortex';

export interface SlotPlugin {
  renderSlot(entity: Hashed<any>): TemplateResult;
}
