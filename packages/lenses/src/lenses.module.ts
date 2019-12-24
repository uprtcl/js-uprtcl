import { injectable, inject } from 'inversify';

import { CortexTypes } from '@uprtcl/cortex';
import {
  MicroModule,
  Constructor,
  MicroOrchestratorTypes,
  ModuleProvider
} from '@uprtcl/micro-orchestrator';
import { GraphQlTypes, graphQlSchemaModule } from '@uprtcl/common';

import { CortexEntity } from './elements/cortex-entity';
import { CortexLensSelector } from './elements/cortex-lens-selector';
import { CortexEntityBase } from './elements/cortex-entity-base';
import { CortexActions } from './elements/cortex-actions';
import { LensesPlugin } from './types';
import { SlotPlugin } from './plugins/slot.plugin';
import { lensesSchema } from './graphql.schema';
import { CortexLoadingPlaceholder } from './elements/cortex-loading-placeholder';

const isSlotPlugin = (p: LensesPlugin) => (p as SlotPlugin).renderSlot;

export function lensesModule(plugins: Array<{ name: string; plugin: LensesPlugin }>): any {
  const cortexEntity: Constructor<CortexEntityBase> = class extends CortexEntity {
    get slotPlugins() {
      return plugins
        .filter(p => isSlotPlugin(p.plugin))
        .reduce((acc, p) => ({ ...acc, [p.name]: p.plugin }), {});
    }
  };

  @injectable()
  class LensesModule implements MicroModule {
    constructor(
      @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
    ) {}

    async onLoad(): Promise<void> {
      await this.moduleProvider(CortexTypes.Module);
      await this.moduleProvider(GraphQlTypes.Module);

      customElements.define('cortex-actions', CortexActions);
      customElements.define('cortex-lens-selector', CortexLensSelector);
      customElements.define('cortex-entity', cortexEntity);
      customElements.define('cortex-loading-placeholder', CortexLoadingPlaceholder);
    }

    submodules = [graphQlSchemaModule(lensesSchema, {})];
  }
  return LensesModule;
}
