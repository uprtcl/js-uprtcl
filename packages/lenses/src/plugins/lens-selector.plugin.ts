import { injectable } from 'inversify';
import { html } from 'lit-element';

import { Hashed } from '@uprtcl/cortex';

import { LensesPlugin } from './lenses-plugin';

@injectable()
export class LensSelectorPlugin implements LensesPlugin {
  render(entity: Hashed<any>) {
    return html`
      <cortex-lens-selector .hash=${entity.id}></cortex-lens-selector>
    `;
  }
}
