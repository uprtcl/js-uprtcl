import { Dictionary } from 'lodash';
import { UplAuth } from '@uprtcl/cortex';

import { AuthAction, UPDATE_UPL_AUTH } from './auth.actions';

export interface AuthState {
  uplAuthsInfo: Dictionary<UplAuth>;
}

export const initialState: AuthState = {
  uplAuthsInfo: {}
};

export function authReducer(state = initialState, action: AuthAction): AuthState {
  switch (action.type) {
    case UPDATE_UPL_AUTH: {
      return {
        ...state,
        uplAuthsInfo: {
          ...state.uplAuthsInfo,
          [action.payload.upl]: action.payload.uplAuth
        }
      };
    }

    default: {
      return state;
    }
  }
}
