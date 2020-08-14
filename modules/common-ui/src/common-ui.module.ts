import { MicroModule } from '@uprtcl/micro-orchestrator';
import { Button } from '@material/mwc-button';

export class CommonUIModule extends MicroModule {
  static id = 'common-ui-module';

  async onLoad() {
    customElements.define('uprtcl-mwc-button', Button);
  }

  get submodules() {
    return [
    ];
  }

  static bindings = undefined;
}
