import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesHttpBindings } from './bindings';

export class EveesHttpModule extends MicroModule {
  static id = 'evees-http-module';
  static bindings = EveesHttpBindings;

  logger = new Logger('EVEES-HTTP-MODULE');

  async onLoad() {
  }

  get submodules() {
    return [];
  }
}
