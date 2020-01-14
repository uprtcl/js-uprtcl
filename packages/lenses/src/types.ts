import {TemplateResult} from 'lit-element';

import { SlotPlugin } from './plugins/slot.plugin';

export interface Lens {
  name: string;
  render: (lensContent: TemplateResult, context: any) => TemplateResult;
  type?: string;
}

export type LensesPlugin = SlotPlugin;