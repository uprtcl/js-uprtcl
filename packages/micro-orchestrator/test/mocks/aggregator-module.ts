import { MicroModule } from '../../src/orchestrator/micro.module';
import { MockModule } from './mock.module';
import { DependantModule } from './dependant-module';

export class AggregatorModule extends MicroModule {
  get submodules() {
    return [new DependantModule(), new MockModule()];
  }

  async onLoad() {}
}
