import { MicroModule, Dictionary, Constructor } from '@uprtcl/micro-orchestrator';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { PatternsModule, Pattern } from '@uprtcl/cortex';

import { mockSchema } from './mock.schema';
import { MockPattern } from './mock.pattern';
import { CASModule } from '../../src/cas.module';
import { MockSource } from './mock.source';

export class MockModule extends MicroModule {
  constructor(
    protected initialObjects: Dictionary<any>,
    protected initialPatterns: Array<Constructor<Pattern>> = []
  ) {
    super();
  }

  async onLoad() {}

  submodules = [
    new GraphQlSchemaModule(mockSchema),
    new PatternsModule({ [Symbol('mock')]: [MockPattern, ...this.initialPatterns] }),
    new CASModule([new MockSource(this.initialObjects)])
  ];
}
