import { Dictionary } from 'lodash';
import { interfaces, injectable } from 'inversify';

import { MicroModule, Constructor } from '@uprtcl/micro-orchestrator';

import { CortexEntity } from './elements/cortex-entity';
import { lenses } from './lenses';
import { CortexLensSelector } from './elements/cortex-lens-selector';
import { LensesPlugin } from './plugins/lenses-plugin';
import { CortexEntityBase } from './elements/cortex-entity-base';
import { CortexActions } from './elements/cortex-actions';

export function lensesModule(plugins: Dictionary<Constructor<LensesPlugin>>): any {
  @injectable()
  class LensesModule implements MicroModule {
    async onLoad(
      context: interfaces.Context,
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): Promise<void> {
      function getPlugins(): Dictionary<LensesPlugin> {
        return Object.entries(plugins).reduce(
          (acc, [key, plugin]) => ({
            ...acc,
            [key]: context.container.resolve(plugin)
          }),
          {}
        );
      }

      let cortexEntity: Constructor<CortexEntityBase> = class extends CortexEntity {
        get plugins() {
          return getPlugins();
        }
      };

      customElements.define('cortex-actions', CortexActions);
      customElements.define('cortex-lens-selector', CortexLensSelector);
      customElements.define('cortex-entity', cortexEntity);

      Object.entries(lenses).forEach(([tag, lens]) => {
        customElements.define(tag, lens);
      });
    }
  }
  return LensesModule;
}
