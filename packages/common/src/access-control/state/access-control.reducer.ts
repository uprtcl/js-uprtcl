import { Dictionary } from 'lodash';
import { AccessControlAction, LOAD_ACCESS_CONTROL_SUCCESS } from './access-control.actions';

export interface AccessControlState {
  accessControl: Dictionary<any>;
}

export const initialState: AccessControlState = {
  accessControl: {}
};

export function accessControlReducer(
  state = initialState,
  action: AccessControlAction
): AccessControlState {
  switch (action.type) {
    case LOAD_ACCESS_CONTROL_SUCCESS: {
      return {
        ...state,
        accessControl: {
          ...state.accessControl,
          [action.payload.hash]: action.payload.accessControl
        }
      };
    }

    default: {
      return state;
    }
  }
}
