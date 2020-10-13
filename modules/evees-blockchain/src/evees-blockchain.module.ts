import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesBlockchainBindings } from './bindings';
import { PermissionsFixedLense } from './provider/evees-acl.fixed.lense';
import { EveesBlockchainCachedRemoteLense } from './provider/evees-remote.cached.lense';

export class EveesBlockchainModule extends MicroModule {
  static id = 'evees-blockchain-module';
  static bindings = EveesBlockchainBindings;

  logger = new Logger('EVEES-BLOCKCHAIN-MODULE');

  async onLoad() {
    customElements.define('evees-permissions-fixed', PermissionsFixedLense);
    customElements.define('evees-blockchain-remote', EveesBlockchainCachedRemoteLense);    
  }

  get submodules() {
    return [];
  }
}
