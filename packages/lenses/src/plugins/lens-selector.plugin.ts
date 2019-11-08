import { html } from 'lit-element';

import { Constructor } from '@uprtcl/micro-orchestrator';

import { CortexEntityBase } from '../elements/cortex-entity-base';
import { LensesPlugin } from './lenses-plugin';

export const lensSelectorPlugin = <T extends CortexEntityBase>(): LensesPlugin<T> => (
  baseElement: Constructor<CortexEntityBase>
): Constructor<CortexEntityBase> =>
  class extends baseElement {
    renderPlugins() {
      return [
        ...super.renderPlugins(),
        html`
          <cortex-lens-selector .isomorphisms=${this.isomorphisms}></cortex-lens-selector>
        `
      ];
    }
  };
