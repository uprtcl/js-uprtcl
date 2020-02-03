import { MicroModule, Constructor, Dictionary } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/graphql';

import { CortexEntity } from './elements/cortex-entity';
import { CortexLensSelector } from './elements/cortex-lens-selector';
import { CortexEntityBase } from './elements/cortex-entity-base';
import { CortexActions } from './elements/cortex-actions';
import { LensesPlugin } from './types';
import { SlotPlugin } from './plugins/slot.plugin';
import { lensesSchema } from './graphql.schema';
import { CortexLoadingPlaceholder } from './elements/cortex-loading-placeholder';
import { CortexPattern } from './elements/cortex-pattern';

const isSlotPlugin = (p: LensesPlugin) => (p as SlotPlugin).renderSlot;

export class LensesModule extends MicroModule {
  dependencies = [CortexModule.id];
  submodules = [new GraphQlSchemaModule(lensesSchema, {})];

  constructor(protected plugins: Dictionary<LensesPlugin>) {
    super();
  }

  async onLoad(): Promise<void> {
    const plugins = this.plugins;
    const cortexEntity: Constructor<CortexEntityBase> = class extends CortexEntity {
      get slotPlugins() {
        return Object.entries(plugins)
          .filter(([key, plugin]) => isSlotPlugin(plugin))
          .reduce((acc, [key, plugin]) => ({ ...acc, [key]: plugin }), {});
      }
    };

    customElements.define('cortex-actions', CortexActions);
    customElements.define('cortex-lens-selector', CortexLensSelector);
    customElements.define('cortex-entity', cortexEntity);
    customElements.define('cortex-pattern', CortexPattern);
    customElements.define('cortex-loading-placeholder', CortexLoadingPlaceholder);
  }
}
