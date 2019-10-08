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
import { UprtclTypes } from './types';
import { UprtclProvider } from './services/uprtcl.provider';

export function uprtclModule(
  discoverableUprtcl: DiscoverableSource<UprtclProvider>
): new (...args: any[]) => CortexModule {
  @injectable()
  class UprtclModule extends CortexModule {
    get elements() {
      return [{ tag: 'commit-history', element: CommitHistory }];
    }

    get sources() {
      return [{ symbol: UprtclTypes.UprtclProvider, source: discoverableUprtcl }];
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
