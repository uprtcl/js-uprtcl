import { interfaces } from 'inversify';

import { MicroModule } from '../../src/orchestrator/micro.module';
import { MockElement } from './mock-element';
import { MockBindings } from './mock-bindings';

export class MockModule extends MicroModule {
  static id: string = 'mock';

  static bindings = MockBindings;

  dependencies: string[] = [];

  async onLoad(container: interfaces.Container): Promise<void> {
    container.bind(MockModule.bindings.Mock).toConstantValue(5);

    if (!customElements.get('mock-element')) {
      customElements.define('mock-element', MockElement);
    }
  }
}
