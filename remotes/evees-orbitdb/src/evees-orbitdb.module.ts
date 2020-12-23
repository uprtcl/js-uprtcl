import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesOrbitDBBindings } from './bindings';
import { PermissionsOrbitdDb } from './provider/evees-acl.orbit-db.lense';
import { RemoteOrbitdDbLense } from './provider/evees-remote.orbit-db.lense';
import { OrbitDBProfile } from './provider/profile/orbitdb.profile';

export class EveesOrbitDBModule extends MicroModule {
  static id = 'evees-orbitdb-module';
  static bindings = EveesOrbitDBBindings;

  logger = new Logger('EVEES-ORBITDB-MODULE');

  async onLoad() {
    customElements.define('evees-orbitdb-permissions', PermissionsOrbitdDb);
    customElements.define('evees-orbitdb-remote', RemoteOrbitdDbLense);
    customElements.define('orbitdb-profile', OrbitDBProfile);
  }

  get submodules() {
    return [];
  }
}
