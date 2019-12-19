import {TemplateResult} from 'lit-element';

import { Hashed } from '@uprtcl/cortex';
import { SlotPlugin } from './plugins/slot.plugin';
import { RenderLensPlugin } from './plugins/render-lens.plugin';

export interface Lens {
  name: string;
  tag: string;
  render: (lensContent: TemplateResult) => TemplateResult;
}

export interface Isomorphisms {
  entity: Hashed<object>;
  isomorphisms: Array<any>;
}

export type LensesPlugin = SlotPlugin | RenderLensPlugin;

export interface CortexConfig {
  lens: string
}