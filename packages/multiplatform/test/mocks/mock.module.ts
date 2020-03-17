import { MicroModule, Dictionary, Constructor } from '@uprtcl/micro-orchestrator';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { PatternsModule, Hashed, Pattern } from '@uprtcl/cortex';

import { mockSchema } from './mock.schema';
import { MockPattern } from './mock.pattern';
import { SourcesModule } from '../../src/sources.module';
import { MockSource } from './mock.source';

export class MockModule extends MicroModule {
  constructor(
    protected initialObjects: Dictionary<Hashed<any>>,
    protected initialPatterns: Array<Constructor<Pattern>> = []
  ) {
    super();
  }

  async onLoad() {}

  submodules = [
    new GraphQlSchemaModule(mockSchema),
    new PatternsModule({ [Symbol('mock')]: [MockPattern, ...this.initialPatterns] }),
    new SourcesModule([
      { source: new MockSource(this.initialObjects), symbol: Symbol('mock-source') }
    ])
  ];
}
