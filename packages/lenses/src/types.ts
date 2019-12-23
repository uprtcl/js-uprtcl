import {TemplateResult} from 'lit-element';

import { SlotPlugin } from './plugins/slot.plugin';
import { RenderLensPlugin } from './plugins/render-lens.plugin';

export interface Lens {
  name: string;
  render: (lensContent: TemplateResult) => TemplateResult;
  type?: string;
}

export type LensesPlugin = SlotPlugin | RenderLensPlugin;