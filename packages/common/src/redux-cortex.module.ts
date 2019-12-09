import { interfaces, injectable } from 'inversify';
import { Store } from 'redux';

import { CortexModule } from '@uprtcl/cortex';
import { ReduxTypes } from '@uprtcl/micro-orchestrator';
import { UpdateUplAuth, UPDATE_UPL_AUTH } from './auth/state/auth.actions';
import { AuthTypes } from './types';

@injectable()
export class ReduxCortexModule extends CortexModule {
  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    await this.moduleProvider(ReduxTypes.Module);
    await this.moduleProvider(AuthTypes.Module);

    await super.onLoad(context, bind, unbind, isBound, rebind);

    const store: Store = context.container.get(ReduxTypes.Store);

    if (this.sources) {
      for (const source of this.sources) {
        const authInfo = source.source.uplAuth;
        if (authInfo) {
          const updateUplAuth: UpdateUplAuth = {
            type: UPDATE_UPL_AUTH,
            payload: {
              upl: source.source.uprtclProviderLocator,
              uplAuth: authInfo
            }
          };
          store.dispatch(updateUplAuth);
        }
      }
    }
  }
}
