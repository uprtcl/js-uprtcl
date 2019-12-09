import { html } from 'lit-element';

import { Constructor } from '@uprtcl/micro-orchestrator';

import { CortexEntityBase } from '../elements/cortex-entity-base';
import { LensesPlugin } from './lenses-plugin';

export const actionsPlugin = <T extends CortexEntityBase>(): LensesPlugin<T> => (
  baseElement: Constructor<CortexEntityBase>
): Constructor<CortexEntityBase> =>
  class extends baseElement {
    renderPlugins() {
      return [
        ...super.renderPlugins(),
        html`
          <cortex-pattern-actions .entityId=${this.hash}></cortex-pattern-actions>
        `
      ];
    }
  };
