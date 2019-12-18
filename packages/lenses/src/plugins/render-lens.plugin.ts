import { TemplateResult } from 'lit-element';

import { Hashed } from '@uprtcl/cortex';
import { Lens } from '../types';

export interface RenderLensPlugin {
  renderLens(
    lensContent: TemplateResult,
    entity: Hashed<any> | undefined,
    lens: Lens | undefined
  ): TemplateResult;
}
