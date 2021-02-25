import { EveesContentModule } from '@uprtcl/evees';

import { WikiCommon, WikiLinks, WikiPattern } from './patterns/wiki.pattern';
import { WikiDiff } from './elements/wiki-diff';
import { EditableWiki } from './elements/wiki.editable';
import { PageListEditable } from './elements/page-list-editable';
import { PageItemElement } from './elements/page-item';

export class WikisModule implements EveesContentModule {
  static id = 'wikis-module';

  async registerComponents() {
    customElements.define('editable-wiki', EditableWiki);
    customElements.define('editable-page-list', PageListEditable);
    customElements.define('page-list-item', PageItemElement);
    customElements.define('wiki-diff', WikiDiff);
  }

  getPatterns() {
    return [new WikiPattern([new WikiCommon(), new WikiLinks()])];
  }
}
