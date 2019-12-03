import { injectable } from 'inversify';

import { DiscoverableSource, PatternTypes } from '@uprtcl/cortex';
import {
  DefaultSecuredPattern,
  DefaultSignedPattern,
  ReduxCortexModule,
  CidHashedPattern
} from '@uprtcl/common';

import { PerspectivePattern } from './patterns/perspective.pattern';
import { CommitPattern } from './patterns/commit.pattern';
import { CommitHistory } from './lenses/commit-history';
import { PerspectivesList } from './lenses/perspectives-list';
import { EveesTypes, EveesLocal } from './types';
import { EveesDexie } from './services/providers/evees.dexie';
import { Evees } from './services/evees';
import { EveesRemote } from './services/evees.remote';
import { EveesReduxModule } from './state';
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
 * const discoverableEveesHolo = { service: eveesHolochain, knownSources };
 * const discoverableEveesEth = { service: eveesEth, knownSources };
 *
 * const evees = eveesModule([discoverableEveesHolo, discoverableEveesEth]);
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
 * @param discoverableEvees
 * @param localEvees
 * @returns a configured _Prtcl Evees module ready to be used with `micro-orchestrator`
 */
export function eveesModule(
  discoverableEvees: Array<DiscoverableSource<EveesRemote>>,
  localEvees: new (...args: any[]) => EveesLocal = EveesDexie
): new (...args: any[]) => ReduxCortexModule {
  @injectable()
  class EveesModule extends ReduxCortexModule {
    get elements() {
      return [
        { name: 'commit-history', element: CommitHistory },
        { name: 'perspectives-list', element: PerspectivesList }
      ];
    }

    get sources() {
      return discoverableEvees.map(evees => ({
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

    submodules = [EveesReduxModule];
  }

  return EveesModule;
}
