import { PatternsModule } from '@uprtcl/cortex';
import { EveesContentModule } from '@uprtcl/evees';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { MicroModule, i18nextModule, Dictionary } from '@uprtcl/micro-orchestrator';

import { WikiDrawer } from './elements/wiki-drawer';
import { WikiCommon, WikiLinks, WikiEntity } from './patterns/wiki.entity';
import { wikiTypeDefs } from './graphql/schema';
import { WikiPage } from './elements/wiki-page';
import { WikiHome } from './elements/wiki-home';

import en from './i18n/en.json';
import { WikiBindings } from './bindings';
import { interfaces, Container } from 'inversify';

/**
 * Configure a wikis module with the given providers
 *
 * Depends on: lensesModule, PatternsModule, multiSourceModule
 *
 * Example usage:
 *
 * ```ts
 * import { IpfsStore } from '@uprtcl/ipfs-provider';
 * import { wikisModule, WikisTypes, WikisIpfs } from '@uprtcl/wikis';
 *
 * const ipfsConnection = new IpfsConnection({
 *   host: 'ipfs.infura.io',
 *   port: 5001,
 *   protocol: 'https'
 * });
 *
 *  const wikisProvider = new wikisIpfs(ipfsConnection);
 *
 * const wikis = new WikisModule([ wikisProvider ]);
 * await orchestrator.loadModule(wikis);
 * ```
 *
 * @category CortexModule
 *
 * @param wikisRemote an array of remotes of wikis
 */
export class WikisModule extends EveesContentModule {
  static id = 'wikis-module';

  static bindings = WikiBindings;

  providerIdentifier = WikiBindings.WikisRemote;

  async onLoad(container: Container) {
    super.onLoad(container);
    customElements.define('wiki-drawer', WikiDrawer);
    customElements.define('wiki-page', WikiPage);
    customElements.define('wiki-home', WikiHome);
  }

  get submodules() {
    return [
      ...super.submodules,
      new GraphQlSchemaModule(wikiTypeDefs, {}),
      new i18nextModule('wikis', { en: en }),
      new PatternsModule([new WikiEntity([WikiCommon, WikiLinks])])
    ];
  }
}
