import { MicroModule, Dictionary } from '@uprtcl/micro-orchestrator';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { PatternsModule, Pattern } from '@uprtcl/cortex';
import { CASModule } from '@uprtcl/multiplatform';

import { mockSchema } from './mock.schema';
import { MockPattern, Lenses } from './mock.pattern';
import { MockSource } from './mock.source';
import { MockElement } from './mock-element';

export class MockModule extends MicroModule {
  constructor(protected initialObjects: Dictionary<any>) {
    super();
  }

  async onLoad() {
    customElements.define('mock-element', MockElement);
  }

  get submodules() {
    return [
      new GraphQlSchemaModule(mockSchema),
      new PatternsModule([new MockPattern([Lenses])]),
      new CASModule([new MockSource(this.initialObjects)]),
    ];
  }
}
