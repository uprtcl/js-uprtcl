import merge from 'lodash/merge';
import { injectable, interfaces } from 'inversify';
import { MicroModule } from '@uprtcl/micro-orchestrator';
import {
  DiscoveryTypes,
  DiscoverableSource,
  DefaultHashedPattern,
  DefaultSignedPattern,
  DefaultSecuredPattern,
  ValidatePattern,
  TransformPattern,
  HashedPattern,
  SecuredPattern,
  PatternTypes,
  SignedPattern,
  Hashed,
  Secured
} from '@uprtcl/cortex';

import { PerspectivePattern } from './patterns/perspective.pattern';
import { CommitPattern } from './patterns/commit.pattern';
import { ContextPattern } from './patterns/context.pattern';
import { CommitHistory } from './lenses/commit-history';
import { UprtclTypes } from './types';
import { UprtclProvider } from './services/uprtcl/uprtcl.provider';

export function uprtclModule(discoverableUprtcl: DiscoverableSource<UprtclProvider>): any {
  @injectable()
  class UprtclModule implements MicroModule {
    async onLoad(
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): Promise<void> {

      bind<DiscoverableSource>(DiscoveryTypes.DiscoverableSource).toConstantValue(discoverableUprtcl);
      bind<UprtclProvider>(UprtclTypes.UprtclProvider).toConstantValue(discoverableUprtcl.source);

      // Patterns
      bind<HashedPattern<any> | TransformPattern<Hashed<any>, [any]>>(PatternTypes.Core.Hashed).to(
        DefaultHashedPattern
      );
      bind<HashedPattern<any> | TransformPattern<Hashed<any>, [any]>>(PatternTypes.Pattern).to(
        DefaultHashedPattern
      );

      bind<SignedPattern<any>>(PatternTypes.Core.Signed).to(DefaultSignedPattern);
      bind<SignedPattern<any>>(PatternTypes.Pattern).to(DefaultSignedPattern);

      bind<SecuredPattern<Secured<any>>>(PatternTypes.Core.Secured).to(DefaultSecuredPattern);
      bind<SecuredPattern<Secured<any>>>(PatternTypes.Pattern).to(DefaultSecuredPattern);

      bind<PerspectivePattern>(UprtclTypes.PerspectivePattern).to(PerspectivePattern);
      bind<CommitPattern>(UprtclTypes.CommitPattern).to(CommitPattern);
      bind<ContextPattern>(UprtclTypes.ContextPattern).to(ContextPattern);

      bind<PerspectivePattern>(PatternTypes.Pattern).to(PerspectivePattern);
      bind<CommitPattern>(PatternTypes.Pattern).to(CommitPattern);
      bind<ContextPattern>(PatternTypes.Pattern).to(ContextPattern);

      customElements.define('commit-history', CommitHistory);
    }

    async onUnload(): Promise<void> {}
  }

  return UprtclModule;
}
