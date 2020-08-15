import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { CommonUIBindings } from './bindings';
import { UprtclButton } from './elements/button';

export class CommonUIModule extends MicroModule {
  static id = 'common-ui-module';
  static bindings = CommonUIBindings;

  logger = new Logger('COMMON-UI-MODULE');

  async onLoad() {
    customElements.define('uprtcl-button', UprtclButton);
  }

  get submodules() {
    return [];
  }
}
