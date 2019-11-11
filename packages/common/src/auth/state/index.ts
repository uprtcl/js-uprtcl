import { MicroModule, reduxModule } from '@uprtcl/micro-orchestrator';
import { AuthAction } from './auth.actions';
import { authReducer } from './auth.reducer';
import { authReducerName } from './auth.selectors';

export function authReduxModule(): MicroModule {
  return reduxModule<any, AuthAction>({
    [authReducerName]: authReducer
  });
}
