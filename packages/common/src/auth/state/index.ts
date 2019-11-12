import { injectable } from 'inversify';

import { ReduxModule } from '@uprtcl/micro-orchestrator';

import { AuthAction } from './auth.actions';
import { authReducer } from './auth.reducer';
import { authReducerName } from './auth.selectors';

@injectable()
export class AuthReduxModule extends ReduxModule<any, AuthAction> {
  reducersMap = {
    [authReducerName]: authReducer
  };
}
