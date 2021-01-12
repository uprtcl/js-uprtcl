import { EveesContentModule, Logger } from '@uprtcl/evees';

import { EveesHttpBindings } from './bindings';
import { EveesAccessControlHttpLense } from './provider/evees-acl.http.lense';

export class EveesHttpModule extends EveesContentModule {
  static id = 'evees-http-module';
  static bindings = EveesHttpBindings;

  logger = new Logger('EVEES-HTTP-MODULE');

  async onLoad() {
    customElements.define('evees-http-permissions', EveesAccessControlHttpLense);
  }

  get submodules() {
    return [];
  }
}
