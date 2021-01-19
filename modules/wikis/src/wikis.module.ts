import { EveesContentModule } from '@uprtcl/evees';

import { WikiDrawer } from './elements/wiki-drawer';
import { WikiCommon, WikiLinks, WikiPattern } from './patterns/wiki.pattern';

import { WikiDiff } from './elements/wiki-diff';
import { WikiDrawerContent } from './elements/wiki-drawer-content';

export class WikisModule implements EveesContentModule {
  static id = 'wikis-module';

  async registerComponents() {
    customElements.define('wiki-drawer', WikiDrawer);
    customElements.define('wiki-drawer-content', WikiDrawerContent);
    customElements.define('wiki-diff', WikiDiff);
  }

  getPatterns() {
    return [new WikiPattern([WikiCommon, WikiLinks])];
  }
}
