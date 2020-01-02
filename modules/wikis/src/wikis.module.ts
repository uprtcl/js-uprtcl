import { injectable, interfaces } from 'inversify';

import { PatternsModule } from '@uprtcl/cortex';
import { SourcesModule } from '@uprtcl/multiplatform';
import { GraphQlSchemaModule } from '@uprtcl/common';
import {
  ElementsModule,
  MicroModule,
  Constructor,
  i18nextModule
} from '@uprtcl/micro-orchestrator';

import { WikiDrawer } from './elements/wiki-drawer';
import { WikiCommon, WikiLinks, WikiCreate } from './patterns/wiki.entity';
import { WikisLocal } from './services/wikis.local';
import { Wikis } from './services/wikis';
import { WikisRemote } from './services/wikis.remote';
import { wikiTypeDefs } from './graphql';
import { WikiPage } from './elements/wiki-page';
import { WikiHome } from './elements/wiki-home';

import en from '../i18n/en.json';

/**
 * Configure a wikis module with the given providers
 *
 * Depends on: lensesModule, PatternsModule, discoveryModule
 *
 * Example usage:
 *
 * ```ts
 * import { IpfsConnection } from '@uprtcl/connections';
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

  static types = {
    WikiEntity: Symbol('wiki-entity'),
    WikisLocal: Symbol('wikis-local'),
    WikisRemote: Symbol('wikis-remote'),
    Wikis: Symbol('wikis')
  };

  constructor(protected wikisRemotes: WikisRemote[]) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    container.bind(WikisModule.types.WikisLocal).to(WikisLocal);
    container.bind(WikisModule.types.Wikis).to(Wikis);
  }

  submodules = [
    new GraphQlSchemaModule(wikiTypeDefs, {}),
    new i18nextModule('wikis', { en: en }),
    new SourcesModule(
      this.wikisRemotes.map(remote => ({
        symbol: WikisModule.types.WikisRemote,
        source: remote
      }))
    ),
    new ElementsModule({
      'wiki-drawer': WikiDrawer,
      'wiki-page': WikiPage,
      'wiki-home': WikiHome
    }),
    new PatternsModule({
      [WikisModule.types.WikiEntity]: [WikiCommon, WikiLinks, WikiCreate]
    })
  ];
}
