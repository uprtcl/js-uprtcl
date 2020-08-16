import { MicroModule, Logger } from '@uprtcl/micro-orchestrator';

import { CommonUIBindings } from './bindings';
import { UprtclButton } from './elements/button';
import { UprtclLoading } from './elements/loading';
import { UprtclList } from './elements/list';
import { UprtclListItem } from './elements/list-item';
import { UprtclCard } from './elements/card';

export class CommonUIModule extends MicroModule {
  static id = 'common-ui-module';
  static bindings = CommonUIBindings;

  logger = new Logger('COMMON-UI-MODULE');

  async onLoad() {
    customElements.define('uprtcl-button', UprtclButton);
    customElements.define('uprtcl-loading', UprtclLoading);
    customElements.define('uprtcl-list', UprtclList);
    customElements.define('uprtcl-list-item', UprtclListItem);
    customElements.define('uprtcl-card', UprtclCard);
  }

  get submodules() {
    return [];
  }
}
