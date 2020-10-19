import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesLocalBindings } from './bindings';

export class EveesLocalModule extends MicroModule {
  static id = 'evees-local-module';
  static bindings = EveesLocalBindings;

  logger = new Logger('EVEES-LOCAL-MODULE');

  async onLoad() {}

  get submodules() {
    return [];
  }
}
