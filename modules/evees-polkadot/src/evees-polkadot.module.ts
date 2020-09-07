import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesEthereumBindings } from './bindings';
import { PermissionsEthereum } from './provider/evees-acl.etherum.lense';

export class EveesEthereumModule extends MicroModule {
  static id = 'evees-ethereum-module';
  static bindings = EveesEthereumBindings;

  logger = new Logger('EVEES-ETHEREUM-MODULE');

  async onLoad() {
    customElements.define('evees-ethereum-permissions', PermissionsEthereum);
  }

  get submodules() {
    return [];
  }
}
