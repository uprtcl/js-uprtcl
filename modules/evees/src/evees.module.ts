import { injectable } from 'inversify';

import { PatternTypes } from '@uprtcl/cortex';
import {
  graphQlSchemaModule,
  DefaultSecuredPattern,
  DefaultSignedPattern,
  ReduxCortexModule,
  CidHashedPattern
} from '@uprtcl/common';

import { PerspectivePattern } from './patterns/perspective.pattern';
import { CommitPattern } from './patterns/commit.pattern';
import { CommitHistory } from './lenses/commit-history';
import { EveesTypes, EveesLocal } from './types';
import { EveesDexie } from './services/providers/evees.dexie';
import { Evees } from './services/evees';
import { EveesRemote } from './services/evees.remote';
import { EveesReduxModule } from './state';
import { eveesTypeDefs, eveesResolvers } from './graphql.schema';
import { RecursiveContextMergeStrategy } from './merge/recursive-context.merge-strategy';

/**
 * Configure a _Prtcl Evees module with the given configured providers
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
 *   id: EveesTypes.Module,
 *   module: evees
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
): new (...args: any[]) => ReduxCortexModule {
  @injectable()
  class EveesModule extends ReduxCortexModule {
    get elements() {
      return [{ name: 'commit-history', element: CommitHistory }];
    }

    get sources() {
      return eveesProviders.map(evees => ({
        symbol: EveesTypes.EveesRemote,
        source: evees
      }));
    }

    get services() {
      return [
        { symbol: EveesTypes.EveesLocal, service: localEvees },
        { symbol: EveesTypes.Evees, service: Evees },
        { symbol: EveesTypes.MergeStrategy, service: RecursiveContextMergeStrategy }
      ];
    }

    get patterns() {
      return [
        { symbol: PatternTypes.Core.Hashed, pattern: CidHashedPattern },
        { symbol: PatternTypes.Core.Signed, pattern: DefaultSignedPattern },
        { symbol: PatternTypes.Core.Secured, pattern: DefaultSecuredPattern },
        { symbol: EveesTypes.PerspectivePattern, pattern: PerspectivePattern },
        { symbol: EveesTypes.CommitPattern, pattern: CommitPattern }
      ];
    }

    submodules = [EveesReduxModule, graphQlSchemaModule(eveesTypeDefs, eveesResolvers)];
  }

  return EveesModule;
}
