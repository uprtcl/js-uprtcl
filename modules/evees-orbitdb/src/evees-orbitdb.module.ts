import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesOrbitDBBindings } from './bindings';
import { PermissionsOrbitdDb } from './provider/evees-acl.orbit-db.lense';
import { EveesPolkadotIdentityRemoteLense } from '../../evees-polkadot/src/provider/evees-remote.polkadot-identity.lense';

export class EveesOrbitDBModule extends MicroModule {
  static id = 'evees-orbitdb-module';
  static bindings = EveesOrbitDBBindings;

  logger = new Logger('EVEES-ORBITDB-MODULE');

  async onLoad() {
    customElements.define('evees-orbitdb-permissions', PermissionsOrbitdDb);
    customElements.define('evees-orbitdb-remote', EveesPolkadotIdentityRemoteLense);
  }

  get submodules() {
    return [];
  }
}
