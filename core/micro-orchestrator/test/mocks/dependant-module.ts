import { MicroModule } from '../../src/orchestrator/micro.module';
import { MockModule } from './mock.module';

export class DependantModule extends MicroModule {
  dependencies = [MockModule.id];

  async onLoad() {}
}
