import { interfaces } from 'inversify';

import { ElementsModule, MicroModule, i18nextModule, Dictionary } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';
import { SourcesModule } from '@uprtcl/multiplatform';
import {
  GraphQlSchemaModule,
  DefaultSecuredPattern,
  DefaultSignedPattern,
  CidHashedPattern,
  CorePatterns
} from '@uprtcl/common';
import { AccessControlModule } from '@uprtcl/access-control';

import { PerspectiveLinks, PerspectiveLens } from './patterns/perspective.pattern';
import { CommitPattern, CommitLens, CommitLinked } from './patterns/commit.pattern';
import { CommitHistory } from './elements/evees-commit-history';
import { EveesLocal } from './types';
import { EveesBindings } from './bindings';
import { EveesDexie } from './services/providers/evees.dexie';
import { Evees } from './services/evees';
import { EveesRemote } from './services/evees.remote';
import { eveesTypeDefs, eveesResolvers } from './graphql/schema';
import { RecursiveContextMergeStrategy } from './merge/recursive-context.merge-strategy';
import { PerspectivesList } from './elements/evees-perspectives-list';
import { EveesPerspective } from './elements/evees-perspective';
import { EveesInfo } from './elements/evees-info';


import en from '../i18n/en.json';

/**
 * Configure a _Prtcl Evees module with the given service providers
 *
 * Example usage:
 *
 * ```ts
 * import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
 * import { IpfsConnection, HolochainConnection, EthereumConnection } from '@uprtcl/connections';
 * import { eveesModule, EveesEthereum, EveesHolochain, EveesModule.types } from '@uprtcl/evees';
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
 * const evees = new EveesModule([eveesHolochain, eveesEth]);
 *
 * const orchestrator = new MicroOrchestrator();
 *
 * await orchestrator.loadModules({
 *   [EveesModule.bindings.Module]: evees
 * });
 * ```
 *
 * @category CortexModule
 *
 * @param eveesProviders
 * @param localEvees
 */
export class EveesModule extends MicroModule {
  static id = Symbol('evees-module');

  dependencies = [AccessControlModule.id];

  static bindings = EveesBindings;

  constructor(
    protected eveesProviders: Array<EveesRemote>,
    protected remoteLinks: Dictionary<string>,
    protected localEvees: new (...args: any[]) => EveesLocal = EveesDexie
  ) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    container.bind(EveesModule.bindings.EveesLocal).to(this.localEvees);
    container.bind(EveesModule.bindings.Evees).to(Evees);
    container.bind(EveesModule.bindings.MergeStrategy).to(RecursiveContextMergeStrategy);
  }

  submodules = [
    new GraphQlSchemaModule(eveesTypeDefs, eveesResolvers),
    new ElementsModule({
      'evees-commit-history': CommitHistory,
      'evees-perspectives-list': PerspectivesList,
      'evees-perspective': EveesPerspective,
      'evees-info': EveesInfo
    }),
    new i18nextModule('evees', { en: en }),
    new PatternsModule({
      [CorePatterns.Hashed]: [CidHashedPattern],
      [CorePatterns.Signed]: [DefaultSignedPattern],
      [CorePatterns.Secured]: [DefaultSecuredPattern],
      [EveesModule.bindings.PerspectivePattern]: [PerspectiveLinks, PerspectiveLens],
      [EveesModule.bindings.CommitPattern]: [CommitLinked, CommitPattern, CommitLens]
    }),
    new SourcesModule(
      this.eveesProviders.map(evees => ({
        symbol: EveesModule.bindings.EveesRemote,
        source: evees
      }))
    )
  ];
}
