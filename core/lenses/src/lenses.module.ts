import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';

import { CortexEntity } from './elements/cortex-entity';
import { CortexLensSelector } from './elements/cortex-lens-selector';
import { CortexActions } from './elements/cortex-actions';
import { CortexPattern } from './elements/cortex-pattern';
import { LensSelector } from './types';

export class LensesModule extends MicroModule {
  dependencies = [CortexModule.id];
  get submodules() {
    return [];
  }

  constructor(defaultLensSelector: LensSelector = (lenses) => lenses[0]) {
    super();
  }

  async onLoad(): Promise<void> {
    customElements.define('cortex-actions', CortexActions);
    customElements.define('cortex-lens-selector', CortexLensSelector);
    customElements.define('cortex-entity', CortexEntity);
    customElements.define('cortex-pattern', CortexPattern);
  }
}
