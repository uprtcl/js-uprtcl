import {TemplateResult} from 'lit-element';

import { Hashed } from '@uprtcl/cortex';
import { SlotPlugin } from './plugins/slot.plugin';
import { RenderLensPlugin } from './plugins/render-lens.plugin';

export interface Lens {
  name: string;
  type: string;
  render: (lensContent: TemplateResult) => TemplateResult;
  type?: string;
}

export interface Isomorphisms {
  entity: Hashed<object>;
  isomorphisms: Array<any>;
}

export type LensesPlugin = SlotPlugin | RenderLensPlugin;