import { MicroModule, Dictionary } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';

import { MockPattern, Text } from './mock.pattern';
import { CASModule } from '../../src/cas.module';
import { MockSource } from './mock.store';

export class MockModule extends MicroModule {
  constructor(protected initialObjects: Dictionary<any>) {
    super();
  }

  async onLoad() {}

  get submodules() {
    return [
      new PatternsModule([new MockPattern([Text])]),
      new CASModule([new MockSource(this.initialObjects)]),
    ];
  }
}
