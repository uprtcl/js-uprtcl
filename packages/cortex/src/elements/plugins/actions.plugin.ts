import { Constructor } from '@uprtcl/micro-orchestrator';
import { CortexEntityBase } from '../base/cortex-entity-base';
import { Plugin } from '../base/plugin';
import { html } from 'lit-html';

export const actionsPlugin = <T extends CortexEntityBase>(): Plugin<T> => (
  baseElement: Constructor<CortexEntityBase>
): Constructor<CortexEntityBase> =>
  class extends baseElement {
    renderPlugins() {
      return [
        ...super.renderPlugins(),
        html`
          <cortex-pattern-actions .isomorphisms=${this.isomorphisms}></cortex-pattern-actions>
        `
      ];
    }
  };
