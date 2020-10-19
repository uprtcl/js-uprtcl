import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesLocalBindings } from './bindings';
import { EveesInfoLocal } from './elements/evees-info-local';

export class EveesLocalModule extends MicroModule {
  static id = 'evees-local-module';
  static bindings = EveesLocalBindings;

  logger = new Logger('EVEES-LOCAL-MODULE');

  async onLoad() {
    customElements.define('evees-info-local', EveesInfoLocal);
  }

  get submodules() {
    return [];
  }
}
