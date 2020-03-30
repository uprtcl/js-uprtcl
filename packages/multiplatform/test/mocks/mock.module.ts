import { MicroModule, Dictionary, Constructor } from '@uprtcl/micro-orchestrator';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { PatternsModule, Pattern } from '@uprtcl/cortex';

import { mockSchema } from './mock.schema';
import { MockPattern } from './mock.pattern';
import { CASModule } from '../../src/cas.module';
import { MockSource } from './mock.source';
import { Behaviour } from '@uprtcl/cortex/dist/types/types/behaviour';

export class MockModule extends MicroModule {
  constructor(
    protected initialObjects: Dictionary<any>,
    protected initialPatterns: Array<Constructor<Behaviour<any>>> = []
  ) {
    super();
  }

  async onLoad() {}

  submodules = [
    new GraphQlSchemaModule(mockSchema),
    new PatternsModule([new MockPattern(this.initialPatterns)]),
    new CASModule([new MockSource(this.initialObjects)])
  ];
}
