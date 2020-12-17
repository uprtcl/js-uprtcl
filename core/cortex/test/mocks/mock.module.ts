import { MicroModule, Dictionary } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '../../src/uprtcl-cortex';

import { mockSchema } from './mock.schema';
import { MockPattern, Text } from './mock.pattern';

export class MockModule extends MicroModule {
  constructor(protected initialObjects: Dictionary<any>) {
    super();
  }

  async onLoad() {}

  get submodules() {
    return [];
  }
}
