import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesLocalBindings } from './bindings';

export class EveesBlockchainModule extends MicroModule {
  static id = 'evees-blockchain-module';
  static bindings = EveesLocalBindings;

  logger = new Logger('EVEES-LOCAL-MODULE');

  async onLoad() {}

  get submodules() {
    return [];
  }
}
