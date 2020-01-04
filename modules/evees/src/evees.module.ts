import { interfaces } from 'inversify';

import { ElementsModule, MicroModule, i18nextModule } from '@uprtcl/micro-orchestrator';
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

import { PerspectiveLinks } from './patterns/perspective.pattern';
import { CommitPattern, CommitLens, CommitLinked } from './patterns/commit.pattern';
import { CommitHistory } from './elements/evees-commit-history';
import { EveesLocal, EveesTypes } from './types';
import { EveesDexie } from './services/providers/evees.dexie';
import { Evees } from './services/evees';
import { EveesRemote } from './services/evees.remote';
import { eveesTypeDefs, eveesResolvers } from './graphql/schema';
import { RecursiveContextMergeStrategy } from './merge/recursive-context.merge-strategy';
import { PerspectivesList } from './elements/evees-perspectives-list';

import en from '../i18n/en.json';
import { EveesPerspective } from './elements/evees-perspective';

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
 *   [EveesModule.types.Module]: evees
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

  static types = EveesTypes;

  constructor(
    protected eveesProviders: Array<EveesRemote>,
    protected localEvees: new (...args: any[]) => EveesLocal = EveesDexie
  ) {
    super();
  }
  
  async onLoad(container: interfaces.Container) {
    container.bind(EveesModule.types.EveesLocal).to(this.localEvees);
    container.bind(EveesModule.types.Evees).to(Evees);
    container.bind(EveesModule.types.MergeStrategy).to(RecursiveContextMergeStrategy);
  }

  submodules = [
    new GraphQlSchemaModule(eveesTypeDefs, eveesResolvers),
    new ElementsModule({
      'evees-commit-history': CommitHistory,
      'evees-perspectives-list': PerspectivesList,
      'evees-perspective': EveesPerspective
    }),
    new i18nextModule('evees', { en: en }),
    new PatternsModule({
      [CorePatterns.Hashed]: [CidHashedPattern],
      [CorePatterns.Signed]: [DefaultSignedPattern],
      [CorePatterns.Secured]: [DefaultSecuredPattern],
      [EveesModule.types.PerspectivePattern]: [PerspectiveLinks],
      [EveesModule.types.CommitPattern]: [CommitLinked, CommitPattern, CommitLens]
    }),
    new SourcesModule(
      this.eveesProviders.map(evees => ({
        symbol: EveesModule.types.EveesRemote,
        source: evees
      }))
    )
  ];
}
