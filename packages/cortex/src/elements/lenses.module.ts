import { MicroModule, Constructor } from '@uprtcl/micro-orchestrator';
import { CortexEntity } from './base/cortex-entity';
import { lenses } from './lenses';
import { CortexLensSelector } from './base/cortex-lens-selector';
import { interfaces, injectable } from 'inversify';
import { Plugin } from './base/plugin';
import { CortexEntityBase } from './base/cortex-entity-base';
import { CortexPatternActions } from './base/cortex-pattern-actions';

export function lensesModule(plugins: Array<Plugin<any>>): any {
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

    async onUnload(): Promise<void> {}
  }
  return LensesModule;
}
