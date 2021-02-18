import { EveesContentModule } from '@uprtcl/evees';

import { WikiCommon, WikiLinks, WikiPattern } from './patterns/wiki.pattern';
import { WikiDiff } from './elements/wiki-diff';
import { DaoWiki } from './elements/dao-wiki';

export class WikisModule implements EveesContentModule {
  static id = 'wikis-module';

  async registerComponents() {
    customElements.define('dao-wiki', DaoWiki);
    customElements.define('wiki-diff', WikiDiff);
  }

  getPatterns() {
    return [new WikiPattern([new WikiCommon(), new WikiLinks()])];
  }
}
