import { injectable, interfaces, inject } from 'inversify';

import {
  elementsModule,
  MicroModule,
  Constructor,
  ModuleProvider,
  MicroOrchestratorTypes
} from '@uprtcl/micro-orchestrator';
import { CortexTypes, patternsModule, sourcesModule } from '@uprtcl/cortex';
import {
  graphQlSchemaModule,
  DefaultSecuredPattern,
  DefaultSignedPattern,
  CidHashedPattern,
  i18nModule,
  AccessControlTypes
} from '@uprtcl/common';

import { PerspectiveLinks } from './patterns/perspective.pattern';
import { CommitPattern, CommitLens, CommitLinked } from './patterns/commit.pattern';
import { CommitHistory } from './elements/evees-commit-history';
import { EveesTypes, EveesLocal } from './types';
import { EveesDexie } from './services/providers/evees.dexie';
import { Evees } from './services/evees';
import { EveesRemote } from './services/evees.remote';
import { eveesTypeDefs, eveesResolvers } from './graphql.schema';
import { RecursiveContextMergeStrategy } from './merge/recursive-context.merge-strategy';

import en from '../i18n/en.json';
import { PerspectivesList } from './lenses/perspectives-list';

/**
 * Configure a _Prtcl Evees module with the given service providers
 *
 * Example usage:
 *
 * ```ts
 * import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
 * import { IpfsConnection, HolochainConnection, EthereumConnection } from '@uprtcl/connections';
 * import { eveesModule, EveesEthereum, EveesHolochain, EveesTypes } from '@uprtcl/evees';
 *
 * const ipfsConnection = new IpfsConnection({
 *   host: 'ipfs.infura.io',
 *   port: 5001,
 *   protocol: 'https'
 * });
 *
 * // Don't put anything on host to get from Metamask's ethereum provider
 * const ethConnection = new EthereumConnection({});
 *
 * const eveesEth = new EveesEthereum(ethConnection, ipfsConnection);
 *
 * const knownSources = new KnownSourcesHolochain('test-instance', hcConnection);
 *
 * const hcConnection = new HolochainConnection({ host: 'ws://localhost:8888' });
 *
 * const eveesHolochain = new EveesHolochain('test-instance', hcConnection);
 *
 * const evees = eveesModule([eveesHolochain, eveesEth]);
 *
 * const orchestrator = new MicroOrchestrator();
 *
 * await orchestrator.loadModules({
 *   [EveesTypes.Module]: evees
 * });
 * ```
 *
 * @category CortexModule
 *
 * @param eveesProviders
 * @param localEvees
 * @returns a configured _Prtcl Evees module ready to be used with `micro-orchestrator`
 */
export function eveesModule(
  eveesProviders: Array<EveesRemote>,
  localEvees: new (...args: any[]) => EveesLocal = EveesDexie
): Constructor<MicroModule> {
  @injectable()
  class EveesModule implements MicroModule {
    constructor(
      @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
    ) {}
    async onLoad(context: interfaces.Context, bind: interfaces.Bind) {
      await this.moduleProvider(AccessControlTypes.Module);

      bind(EveesTypes.EveesLocal).to(localEvees);
      bind(EveesTypes.Evees).to(Evees);
      bind(EveesTypes.MergeStrategy).to(RecursiveContextMergeStrategy);
    }

    submodules = [
      graphQlSchemaModule(eveesTypeDefs, eveesResolvers),
      elementsModule({ 
        'evee-commit-history': CommitHistory,
        'evee-perspectives-list': PerspectivesList 
      }),
      i18nModule('evees', { en: en }),
      patternsModule({
        [CortexTypes.Core.Hashed]: [CidHashedPattern],
        [CortexTypes.Core.Signed]: [DefaultSignedPattern],
        [CortexTypes.Core.Secured]: [DefaultSecuredPattern],
        [EveesTypes.PerspectivePattern]: [PerspectiveLinks],
        [EveesTypes.CommitPattern]: [CommitLinked, CommitPattern, CommitLens]
      }),
      sourcesModule(
        eveesProviders.map(evees => ({
          symbol: EveesTypes.EveesRemote,
          source: evees
        }))
      )
    ];
  }

  return EveesModule;
}
