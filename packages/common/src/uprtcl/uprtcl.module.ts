import { injectable } from 'inversify';
import {
  DiscoverableSource,
  CidHashedPattern,
  DefaultSignedPattern,
  DefaultSecuredPattern,
  PatternTypes,
  CortexModule
} from '@uprtcl/cortex';

import { PerspectivePattern } from './patterns/perspective.pattern';
import { CommitPattern } from './patterns/commit.pattern';
import { ContextPattern } from './patterns/context.pattern';
import { CommitHistory } from './lenses/commit-history';
import { UprtclTypes, UprtclLocal } from '../types';
import { UprtclDexie } from './services/providers/uprtcl.dexie';
import { Uprtcl } from './services/uprtcl';
import { UprtclRemote } from './services/uprtcl.remote';

export function uprtclModule(
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
  }

  return UprtclModule;
}
