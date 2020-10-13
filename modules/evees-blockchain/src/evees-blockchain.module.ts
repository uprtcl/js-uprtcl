import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesBlockchainBindings } from './bindings';
import { PermissionsFixedLense } from './provider/evees-acl.fixed.lense';

export class EveesBlockchainModule extends MicroModule {
  static id = 'evees-blockchain-module';
  static bindings = EveesBlockchainBindings;

  logger = new Logger('EVEES-BLOCKCHAIN-MODULE');

  async onLoad() {
    customElements.define('evees-permissions-fixed', PermissionsFixedLense);
  }

  get submodules() {
    return [];
  }
}
