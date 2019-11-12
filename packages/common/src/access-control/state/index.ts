import { Saga } from '@redux-saga/core';
import { injectable, interfaces } from 'inversify';

import { ReduxModule } from '@uprtcl/micro-orchestrator';

import { AccessControlAction } from './access-control.actions';
import { accessControlReducer } from './access-control.reducer';
import { accessControlReducerName } from './access-control.selectors';
import { loadAccessControlOnEntityLoadSaga, loadAccessControlSaga } from './access-control.sagas';
import { AuthTypes, AccessControlTypes, EntitiesTypes } from '../../types';
import { OwnerPattern } from '../patterns/owner.pattern';
import { PatternTypes } from '@uprtcl/cortex';

@injectable()
export class AccessControlReduxModule extends ReduxModule<any, AccessControlAction> {
  reducersMap = {
    [accessControlReducerName]: accessControlReducer
  };

  sagas: Saga[] = [loadAccessControlOnEntityLoadSaga, loadAccessControlSaga];

  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ) {
    await this.moduleProvider(AuthTypes.Module);
    await this.moduleProvider(EntitiesTypes.Module);
    await super.onLoad(context, bind, unbind, isBound, rebind);

    bind<OwnerPattern>(AccessControlTypes.OwnerPattern).to(OwnerPattern);
    bind<OwnerPattern>(PatternTypes.Pattern).to(OwnerPattern);
  }
}
