import { MicroModule, reduxModule } from '@uprtcl/micro-orchestrator';
import { AccessControlAction } from './access-control.actions';
import { accessControlReducer } from './access-control.reducer';
import { accessControlReducerName } from './access-control.selectors';

export function accessControlReduxModule(): MicroModule {
  return reduxModule<any, AccessControlAction>({
    [accessControlReducerName]: accessControlReducer
  });
}
