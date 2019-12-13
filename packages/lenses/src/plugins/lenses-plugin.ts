import { TemplateResult } from 'lit-element';

import { Hashed } from '@uprtcl/cortex';

export interface LensesPlugin {
  render(entity: Hashed<any>): TemplateResult;
}
