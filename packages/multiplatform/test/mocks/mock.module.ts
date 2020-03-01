import { MicroModule } from '@uprtcl/micro-orchestrator';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { mockSchema } from './mock.schema';
import { PatternsModule } from '@uprtcl/cortex';
import { MockPattern } from './mock.pattern';

export class MockModule extends MicroModule {
  submodules = [
    new GraphQlSchemaModule(mockSchema),
    new PatternsModule({ [Symbol('mock')]: [MockPattern] })
  ];
}
