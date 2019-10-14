import { injectable } from 'inversify';
import {
  DiscoverableSource,
  DefaultHashedPattern,
  DefaultSignedPattern,
  DefaultSecuredPattern,
  PatternTypes,
  CortexModule
} from '@uprtcl/cortex';

import { PerspectivePattern } from './patterns/perspective.pattern';
import { CommitPattern } from './patterns/commit.pattern';
import { ContextPattern } from './patterns/context.pattern';
import { CommitHistory } from './lenses/commit-history';
import { UprtclTypes, UprtclCache } from './types';
import { UprtclProvider } from './services/uprtcl.provider';
import { UprtclDexie } from './services/uprtcl.dexie';
import { UprtclMultiplatform } from './services/uprtcl.multiplatform';

export function uprtclModule(
  discoverableUprtcls: Array<DiscoverableSource<UprtclProvider>>,
  localUprtcl: new (...args: any[]) => UprtclCache = UprtclDexie
): new (...args: any[]) => CortexModule {
  @injectable()
  class UprtclModule extends CortexModule {
    get elements() {
      return [{ name: 'commit-history', element: CommitHistory }];
    }

    get sources() {
      return discoverableUprtcls.map(uprtcl => ({
        symbol: UprtclTypes.UprtclProvider,
        source: uprtcl
      }));
    }

    get services() {
      return [
        { symbol: UprtclTypes.UprtclCache, service: localUprtcl },
        { symbol: UprtclTypes.UprtclMultiplatform, service: UprtclMultiplatform }
      ];
    }

    get patterns() {
      return [
        { symbol: PatternTypes.Core.Hashed, pattern: DefaultHashedPattern },
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
