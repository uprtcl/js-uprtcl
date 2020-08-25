import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesEthereumBindings } from './bindings';

export class EveesEthereumModule extends MicroModule {
  static id = 'evees-ethereum-module';
  static bindings = EveesEthereumBindings;

  logger = new Logger('EVEES-ETHEREUM-MODULE');

  async onLoad() {
  }

  get submodules() {
    return [];
  }
}
