import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { EveesHttpBindings } from './bindings';
import { EveesAccessControlHttpLense } from './provider/evees-acl.http.lense';

export class EveesHttpModule extends MicroModule {
  static id = 'evees-http-module';
  static bindings = EveesHttpBindings;

  logger = new Logger('EVEES-HTTP-MODULE');

  async onLoad() {
    customElements.define(
      'evees-http-permissions',
      EveesAccessControlHttpLense
    );
  }

  get submodules() {
    return [];
  }
}
