import { MicroModule } from '@uprtcl/micro-orchestrator';

import { CommonUIBindings } from './bindings';

import { Button } from '@material/mwc-button';

export class CommonUIModule extends MicroModule {
  static id = 'common-ui-module';
  static bindings = CommonUIBindings;

  async onLoad() {
    customElements.define('uprtcl-mwc-button', Button);
  }

  get submodules() {
    return [];
  }
}
