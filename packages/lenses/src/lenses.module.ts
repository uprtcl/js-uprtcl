import { interfaces, injectable } from 'inversify';

import { MicroModule, Constructor } from '@uprtcl/micro-orchestrator';

import { CortexEntity } from './elements/cortex-entity';
import { lenses } from './lenses';
import { CortexLensSelector } from './elements/cortex-lens-selector';
import { LensesPlugin } from './plugins/lenses-plugin';
import { CortexEntityBase } from './elements/cortex-entity-base';
import { CortexPatternActions } from './elements/cortex-pattern-actions';

export function lensesModule(plugins: Array<LensesPlugin<any>>): any {
  @injectable()
  class LensesModule implements MicroModule {
    async onLoad(
      context: interfaces.Context,
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): Promise<void> {
      let cortexEntity: Constructor<CortexEntityBase> = CortexEntity;
      for (const plugin of plugins) {
        cortexEntity = plugin(cortexEntity);
      }

      customElements.define('cortex-pattern-actions', CortexPatternActions);
      customElements.define('cortex-lens-selector', CortexLensSelector);
      customElements.define('cortex-entity', cortexEntity);

      Object.entries(lenses).forEach(([tag, lens]) => {
        customElements.define(tag, lens);
      });
    }
  }
  return LensesModule;
}
