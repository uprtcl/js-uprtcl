import { Constructor } from '@uprtcl/micro-orchestrator';
import { CortexEntityBase } from '../base/cortex-entity-base';
import { Plugin } from '../base/plugin';
import { html } from 'lit-html';

export const lensSelectorPlugin = <T extends CortexEntityBase>(): Plugin<T> => (
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
