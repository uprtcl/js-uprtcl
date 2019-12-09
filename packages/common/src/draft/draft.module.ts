import { interfaces, injectable } from 'inversify';

import { MicroModule, Constructor } from '@uprtcl/micro-orchestrator';

import { DraftsProvider } from './services/drafts.provider';
import { DraftsTypes } from '../types';

export function draftsModule(draftsProvider: DraftsProvider): Constructor<MicroModule> {
  @injectable()
  class DraftsModule implements MicroModule {
    async onLoad(
      context: interfaces.Context,
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): Promise<void> {
      bind<DraftsProvider>(DraftsTypes.DraftsProvider).toConstantValue(draftsProvider);
    }

  }

  return DraftsModule;
}
