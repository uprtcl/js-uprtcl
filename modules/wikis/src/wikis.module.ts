import { injectable, interfaces } from 'inversify';

import { patternsModule, sourcesModule } from '@uprtcl/cortex';
import { graphQlSchemaModule, i18nModule } from '@uprtcl/common';
import { elementsModule, MicroModule, Constructor } from '@uprtcl/micro-orchestrator';

import { WikiNodeLens } from './lenses/wiki-node.lens';
import { WikiCommon, WikiLinks, WikiCreate } from './patterns/wiki.entity';
import { WikisTypes } from './types';
import { WikisLocal } from './services/wikis.local';
import { Wikis } from './services/wikis';
import { WikisRemote } from './services/wikis.remote';
import { wikiTypeDefs } from './graphql';
import { WikiPage } from './elements/wiki-page';
import { Homepage } from './elements/homepage';

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
 * const docs = wikisModule([ wikisProvider ]);
 * await orchestrator.loadModules({
 *   [WikisTypes.Module]: docs
 * });
 * ```
 *
 * @category CortexModule
 *
 * @param wikisRemote an array of remotes of wikis
 * @returns a configured wikis module ready to be loaded
 */
export function wikisModule(wikisRemotes: WikisRemote[]): Constructor<MicroModule> {
  @injectable()
  class WikisModule implements MicroModule {
    async onLoad(context: interfaces.Context, bind: interfaces.Bind) {
      bind(WikisTypes.WikisLocal).to(WikisLocal);
      bind(WikisTypes.Wikis).to(Wikis);
    }

    submodules = [
      graphQlSchemaModule(wikiTypeDefs, {}),
      i18nModule('wikis', { en: en }),
      sourcesModule(
        wikisRemotes.map(remote => ({
          symbol: WikisTypes.WikisRemote,
          source: remote
        }))
      ),
      elementsModule({
        'basic-wiki': WikiNodeLens,
        'wiki-page': WikiPage,
        'home-page': Homepage
      }),
      patternsModule({
        [WikisTypes.WikiEntity]: [WikiCommon, WikiLinks, WikiCreate]
      })
    ];
  }

  return WikisModule;
}
