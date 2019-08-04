import { Dictionary } from 'lodash';

import { MicroModule } from '../../micro-orchestrator/src/modules/micro.module';

export class LensesModule implements MicroModule {
  async onLoad(dependencies: Dictionary<MicroModule>): Promise<void> {}

  onUnload(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getDependencies(): string[] {
    throw new Error('Method not implemented.');
  }
  getId(): string {
    throw new Error('Method not implemented.');
  }
}
