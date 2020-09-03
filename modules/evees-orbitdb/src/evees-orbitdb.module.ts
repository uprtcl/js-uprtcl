import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesOrbitDBBindings } from './bindings';
import { PermissionsOrbitdDb } from './provider/evees-acle.orbit-db.lense';

export class EveesOrbitDBModule extends MicroModule {
  static id = 'evees-orbitdb-module';
  static bindings = EveesOrbitDBBindings;

  logger = new Logger('EVEES-ORBITDB-MODULE');

  async onLoad() {
    customElements.define('evees-orbitdb-permissions', PermissionsOrbitdDb);
  }

  get submodules() {
    return [];
  }
}
