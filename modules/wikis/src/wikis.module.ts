import { PatternsModule } from '@uprtcl/cortex';
import { SourcesModule } from '@uprtcl/multiplatform';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { ElementsModule, MicroModule, i18nextModule, Dictionary } from '@uprtcl/micro-orchestrator';

import { WikiDrawer } from './elements/wiki-drawer';
import { WikiCommon, WikiLinks, WikiCreate } from './patterns/wiki.entity';
import { WikisRemote } from './services/wikis.remote';
import { wikiTypeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { WikiPage } from './elements/wiki-page';
import { WikiHome } from './elements/wiki-home';

import en from '../i18n/en.json';
import { WikiBindings } from './bindings';

/**
 * Configure a wikis module with the given providers
 *
 * Depends on: lensesModule, PatternsModule, discoveryModule
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
  static id = Symbol('wikis-module');

  static bindings = WikiBindings;

  constructor(protected wikisRemotes: WikisRemote[]) {
    super();
  }

  submodules = [
    new GraphQlSchemaModule(wikiTypeDefs, resolvers),
    new i18nextModule('wikis', { en: en }),
    new SourcesModule(
      this.wikisRemotes.map(remote => ({
        symbol: WikisModule.bindings.WikisRemote,
        source: remote
      }))
    ),
    new ElementsModule({
      'wiki-drawer': WikiDrawer,
      'wiki-page': WikiPage,
      'wiki-home': WikiHome
    }),
    new PatternsModule({
      [WikisModule.bindings.WikiEntity]: [WikiCommon, WikiLinks, WikiCreate]
    })
  ];
}
