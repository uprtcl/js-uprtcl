import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesOrbitDBBindings } from './bindings';

export class EveesOrbitDBModule extends MicroModule {
  static id = 'evees-orbitdb-module';
  static bindings = EveesOrbitDBBindings;

  logger = new Logger('EVEES-ORBITDB-MODULE');

  async onLoad() {
  }

  get submodules() {
    return [];
  }
}
