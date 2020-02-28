import { interfaces } from 'inversify';

import { MicroModule } from '../../src/orchestrator/micro.module';

export class MockModule extends MicroModule {
  static id: string = 'mock';

  dependencies: string[] = [];

  async onLoad(container: interfaces.Container): Promise<void> {
    container.bind('mock-id').toConstantValue(5);
  }
}
