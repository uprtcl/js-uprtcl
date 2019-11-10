import { injectable } from 'inversify';

import { DiscoverableSource, PatternTypes, CortexModule } from '@uprtcl/cortex';
import { DefaultSecuredPattern, DefaultSignedPattern, CidHashedPattern } from '@uprtcl/common';

import { PerspectivePattern } from './patterns/perspective.pattern';
import { CommitPattern } from './patterns/commit.pattern';
import { ContextPattern } from './patterns/context.pattern';
import { CommitHistory } from './lenses/commit-history';
import { UprtclTypes, UprtclLocal } from './types';
import { UprtclDexie } from './services/providers/uprtcl.dexie';
import { Uprtcl } from './services/uprtcl';
import { UprtclRemote } from './services/uprtcl.remote';
import { eveesReduxModule } from './state';

/**
 * Configure a _Prtcl module with the given providers
 *
 * Example usage:
 *
 * ```ts
 * import { uprtclModule, UprtclEthereum, UprtclHolochain } from '@uprtcl/common';
 *
 * const uprtclHolochain = new UprtclHolochain({
 *   host: 'ws://localhost:8888',
 *   instance: 'test-instance'
 * });
 *
 * const uprtclEth = new UprtclEthereum('ws://localhost:8545', {
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
 * const discoverableUprtclHolo = { service: uprtclHolochain, knownSources: knownSources };
 * const discoverableUprtclEth = { service: uprtclEth, knownSources: knownSources };
 *
 * const uprtcl = uprtclModule([discoverableUprtclHolo, discoverableUprtclEth]);
 * await orchestrator.loadModules(uprtcl);
 * ```
 *
 * @category CortexModule
 *
 * @param discoverableUprtcls
 * @param localUprtcl
 * @returns a configured _Prtcl module ready to be
 */
export function eveesModule(
  discoverableUprtcls: Array<DiscoverableSource<UprtclRemote>>,
  localUprtcl: new (...args: any[]) => UprtclLocal = UprtclDexie
): new (...args: any[]) => CortexModule {
  @injectable()
  class UprtclModule extends CortexModule {
    get elements() {
      return [{ name: 'commit-history', element: CommitHistory }];
    }

    get sources() {
      return discoverableUprtcls.map(uprtcl => ({
        symbol: UprtclTypes.UprtclRemote,
        source: uprtcl
      }));
    }

    get services() {
      return [
        { symbol: UprtclTypes.UprtclLocal, service: localUprtcl },
        { symbol: UprtclTypes.Uprtcl, service: Uprtcl }
      ];
    }

    get patterns() {
      return [
        { symbol: PatternTypes.Core.Hashed, pattern: CidHashedPattern },
        { symbol: PatternTypes.Core.Signed, pattern: DefaultSignedPattern },
        { symbol: PatternTypes.Core.Secured, pattern: DefaultSecuredPattern },
        { symbol: UprtclTypes.PerspectivePattern, pattern: PerspectivePattern },
        { symbol: UprtclTypes.CommitPattern, pattern: CommitPattern },
        { symbol: UprtclTypes.ContextPattern, pattern: ContextPattern }
      ];
    }

    subModules = [eveesReduxModule()];
  }

  return UprtclModule;
}
