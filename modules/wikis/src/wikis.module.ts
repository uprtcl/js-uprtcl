import { Container } from 'inversify';

import { PatternsModule } from '@uprtcl/cortex';
import { EveesContentModule } from '@uprtcl/evees';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { i18nextModule } from '@uprtcl/micro-orchestrator';

import { WikiDrawer } from './elements/wiki-drawer';
import { WikiCommon, WikiLinks, WikiPattern } from './patterns/wiki.pattern';
import { wikiTypeDefs } from './graphql/schema';

import en from './i18n/en.json';
import { WikiBindings } from './bindings';
import { WikiDiff } from './elements/wiki-diff';
import { WikiDrawerContent } from './elements/wiki-drawer-content';

/**
 * Configure a wikis module with the given providers
 *
 * Depends on: lensesModule, PatternsModule, multiSourceModule
 *
 * Example usage:
 *
 * @category CortexModule
 *
 * @param stores an array of CASStores in which the wiki objects can be stored/retrieved from
 */
export class WikisModule extends EveesContentModule {
  static id = 'wikis-module';

  static bindings = WikiBindings;

  providerIdentifier = WikiBindings.WikisRemote;

  async onLoad(container: Container) {
    super.onLoad(container);
    customElements.define('wiki-drawer', WikiDrawer);
    customElements.define('wiki-drawer-content', WikiDrawerContent);
    customElements.define('wiki-diff', WikiDiff);
  }

  get submodules() {
    return [
      ...super.submodules,
      new GraphQlSchemaModule(wikiTypeDefs, {}),
      new i18nextModule('wikis', { en: en }),
      new PatternsModule([new WikiPattern([WikiCommon, WikiLinks])]),
    ];
  }
}
