import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';
import { GraphQlSchemaModule } from '@uprtcl/graphql';

import { CortexEntity } from './elements/cortex-entity';
import { CortexLensSelector } from './elements/cortex-lens-selector';
import { CortexActions } from './elements/cortex-actions';
import { lensesSchema } from './graphql.schema';
import { CortexLoadingPlaceholder } from './elements/cortex-loading-placeholder';
import { CortexPattern } from './elements/cortex-pattern';
import { LensSelector } from './types';

export class LensesModule extends MicroModule {
  dependencies = [CortexModule.id];
  get submodules() {
    return [new GraphQlSchemaModule(lensesSchema, {})];
  }

  constructor(defaultLensSelector: LensSelector = (lenses) => lenses[0]) {
    super();
  }

  async onLoad(): Promise<void> {
    customElements.define('cortex-actions', CortexActions);
    customElements.define('cortex-lens-selector', CortexLensSelector);
    customElements.define('cortex-entity', CortexEntity);
    customElements.define('cortex-pattern', CortexPattern);
    customElements.define('cortex-loading-placeholder', CortexLoadingPlaceholder);
  }
}
