import { injectable } from 'inversify';
import { html } from 'lit-element';

import { Hashed } from '@uprtcl/cortex';

import { LensesPlugin } from './lenses-plugin';

@injectable()
export class ActionsPlugin implements LensesPlugin {
  render(entity: Hashed<any>) {
    return html`
      <cortex-actions .hash=${entity.id} toolbar="none"></cortex-actions>
    `;
  }
}
