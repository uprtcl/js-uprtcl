import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesPolkadotBindings } from './bindings';

export class EveesPolkadotModule extends MicroModule {
  static id = 'evees-polkadot-module';
  static bindings = EveesPolkadotBindings;

  logger = new Logger('EVEES-POLKADOT-MODULE');

  async onLoad() {}

  get submodules() {
    return [];
  }
}
