import { MicroModule, Dictionary, Constructor } from '@uprtcl/micro-orchestrator';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { PatternsModule, Pattern } from '@uprtcl/cortex';

import { mockSchema } from './mock.schema';
import { MockPattern, Redirect, Text } from './mock.pattern';
import { CASModule } from '../../src/cas.module';
import { MockSource } from './mock.store';

export class MockModule extends MicroModule {
  constructor(protected initialObjects: Dictionary<any>) {
    super();
  }

  async onLoad() {}

  get submodules() {
    return [
      new GraphQlSchemaModule(mockSchema),
      new PatternsModule([new MockPattern([Redirect, Text])]),
      new CASModule([new MockSource(this.initialObjects)]),
    ];
  }
}
