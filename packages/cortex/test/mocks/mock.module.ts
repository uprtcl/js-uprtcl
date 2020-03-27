import { MicroModule, Dictionary, Constructor } from '@uprtcl/micro-orchestrator';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { PatternsModule, Pattern } from '../../src/uprtcl-cortex';

import { mockSchema } from './mock.schema';
import { MockPattern, Content } from './mock.pattern';

export class MockModule extends MicroModule {
  constructor(protected initialObjects: Dictionary<any>) {
    super();
  }

  async onLoad() {}

  submodules = [
    new GraphQlSchemaModule(mockSchema),
    new PatternsModule([new MockPattern([Content])])
  ];
}
