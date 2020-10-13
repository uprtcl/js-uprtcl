import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesEthereumBindings } from './bindings';
import { PermissionsFixedLense } from './provider/evees-acl.fixed.lense';

export class EveesEthereumModule extends MicroModule {
  static id = 'evees-ethereum-module';
  static bindings = EveesEthereumBindings;

  logger = new Logger('EVEES-BLOCKCHAIN-MODULE');

  async onLoad() {
    customElements.define('evees-permissions-fixed', PermissionsFixedLense);
  }

  get submodules() {
    return [];
  }
}
