import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { DraftsProvider } from './services/drafts.provider';
import { DraftsTypes } from './types';

export function draftsModule(draftsProvider: DraftsProvider) {
  return class implements MicroModule {
    async onLoad(
      context: interfaces.Context,
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): Promise<void> {
      bind<DraftsProvider>(DraftsTypes.Drafts).toConstantValue(draftsProvider);
    }

    async onUnload(): Promise<void> {}
  };
}
