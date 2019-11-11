import { injectable } from 'inversify';

import { DiscoverableSource, PatternTypes, CortexModule } from '@uprtcl/cortex';
import { DefaultSecuredPattern, DefaultSignedPattern, CidHashedPattern } from '@uprtcl/common';

import { PerspectivePattern } from './patterns/perspective.pattern';
import { CommitPattern } from './patterns/commit.pattern';
import { ContextPattern } from './patterns/context.pattern';
import { CommitHistory } from './lenses/commit-history';
import { EveesTypes, EveesLocal } from './types';
import { EveesDexie } from './services/providers/evees.dexie';
import { Evees } from './services/evees';
import { EveesRemote } from './services/evees.remote';
import { eveesReduxModule } from './state';

/**
 * Configure a _Prtcl Evees module with the given providers
 *
 * Example usage:
 *
 * ```ts
 * import { eveesModule, EveesEthereum, EveesHolochain, EveesTypes } from '@uprtcl/common';
 *
 * const eveesHolochain = new EveesHolochain({
 *   host: 'ws://localhost:8888',
 *   instance: 'test-instance'
 * });
 *
 * const eveesEth = new EveesEthereum('ws://localhost:8545', {
 *   host: 'ipfs.infura.io',
 *   port: 5001,
 *   protocol: 'https'
 * });
 *
 * const knownSources = new KnownSourcesHolochain({
 *   host: 'ws://localhost:8888',
 *   instance: 'test-instance'
 * });
 *
 * const discoverableEveesHolo = { service: eveesHolochain, knownSources: knownSources };
 * const discoverableEveesEth = { service: eveesEth, knownSources: knownSources };
 *
 * const evees = eveesModule([discoverableEveesHolo, discoverableEveesEth]);
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
 * @returns a configured _Prtcl Evees module ready to be
 */
export function eveesModule(
  discoverableEvees: Array<DiscoverableSource<EveesRemote>>,
  localEvees: new (...args: any[]) => EveesLocal = EveesDexie
): new (...args: any[]) => CortexModule {
  @injectable()
  class EveesModule extends CortexModule {
    get elements() {
      return [{ name: 'commit-history', element: CommitHistory }];
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
        { symbol: EveesTypes.Evees, service: Evees }
      ];
    }

    get patterns() {
      return [
        { symbol: PatternTypes.Core.Hashed, pattern: CidHashedPattern },
        { symbol: PatternTypes.Core.Signed, pattern: DefaultSignedPattern },
        { symbol: PatternTypes.Core.Secured, pattern: DefaultSecuredPattern },
        { symbol: EveesTypes.PerspectivePattern, pattern: PerspectivePattern },
        { symbol: EveesTypes.CommitPattern, pattern: CommitPattern },
        { symbol: EveesTypes.ContextPattern, pattern: ContextPattern }
      ];
    }

    submodules = [eveesReduxModule()];
  }

  return EveesModule;
}
