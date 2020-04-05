import { PatternsModule } from '@uprtcl/cortex';
import { StoresModule, Store } from '@uprtcl/multiplatform';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { MicroModule, i18nextModule, Dictionary } from '@uprtcl/micro-orchestrator';

import { WikiDrawer } from './elements/wiki-drawer';
import { WikiCommon, WikiLinks, WikiCreate } from './patterns/wiki.entity';
import { wikiTypeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { WikiPage } from './elements/wiki-page';
import { WikiHome } from './elements/wiki-home';

import en from './i18n/en.json';
import { WikiBindings } from './bindings';

/**
 * Configure a wikis module with the given providers
 *
 * Depends on: lensesModule, PatternsModule, multiSourceModule
 *
 * Example usage:
 *
 * ```ts
 * import { IpfsConnection } from '@uprtcl/ipfs-provider';
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
export class WikisModule extends MicroModule {
  static id = 'wikis-module';

  static bindings = WikiBindings;

  constructor(protected stores: Store[]) {
    super();
  }

  async onLoad() {
    customElements.define('wiki-drawer', WikiDrawer);
    customElements.define('wiki-page', WikiPage);
    customElements.define('wiki-home', WikiHome);
  }

  submodules = [
    new GraphQlSchemaModule(wikiTypeDefs, resolvers),
    new i18nextModule('wikis', { en: en }),
    new StoresModule(
      this.stores.map(store => ({
        symbol: WikisModule.bindings.WikisRemote,
        store: store
      }))
    ),
    new PatternsModule({
      [WikisModule.bindings.WikiEntity]: [WikiCommon, WikiLinks, WikiCreate]
    })
  ];
}
