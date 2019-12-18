import { injectable, inject } from 'inversify';

import { CortexTypes } from '@uprtcl/cortex';
import {
  MicroModule,
  Constructor,
  MicroOrchestratorTypes,
  ModuleProvider
} from '@uprtcl/micro-orchestrator';

import { CortexEntity } from './elements/cortex-entity';
import { lenses } from './lenses';
import { CortexLensSelector } from './elements/cortex-lens-selector';
import { CortexEntityBase } from './elements/cortex-entity-base';
import { CortexActions } from './elements/cortex-actions';
import { CortexUpdatable } from './elements/cortex-updatable';
import { LensesPlugin } from './types';
import { SlotPlugin } from './plugins/slot.plugin';
import { RenderLensPlugin } from './plugins/render-lens.plugin';

const isSlotPlugin = (p: LensesPlugin) => (p as SlotPlugin).renderSlot;
const isRenderEntityPlugin = (p: LensesPlugin) => (p as RenderLensPlugin).renderLens;

export function lensesModule(plugins: Array<{ name: string; plugin: LensesPlugin }>): any {
  const cortexEntity: Constructor<CortexEntityBase> = class extends CortexEntity {
    get slotPlugins() {
      return plugins
        .filter(p => isSlotPlugin(p.plugin))
        .reduce((acc, p) => ({ ...acc, [p.name]: p.plugin }), {});
    }

    render() {
      const lens = super.render();

      const renderLensPlugins: RenderLensPlugin[] = plugins
        .map(p => p.plugin)
        .filter(p => isRenderEntityPlugin(p)) as RenderLensPlugin[];

      return renderLensPlugins.reduce(
        (acc, next) => next.renderLens(acc, this.entity, this.selectedLens),
        lens
      );
    }
  };

  @injectable()
  class LensesModule implements MicroModule {
    constructor(
      @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
    ) {}

    async onLoad(): Promise<void> {
      await this.moduleProvider(CortexTypes.Module);

      customElements.define('cortex-actions', CortexActions);
      customElements.define('cortex-lens-selector', CortexLensSelector);
      customElements.define('cortex-entity', cortexEntity);
      customElements.define('cortex-updatable', CortexUpdatable);

      Object.entries(lenses).forEach(([tag, lens]) => {
        customElements.define(tag, lens);
      });
    }
  }
  return LensesModule;
}
