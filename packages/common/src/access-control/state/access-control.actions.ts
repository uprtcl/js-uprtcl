import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { AccessControlService } from '../services/access-control.service';
import { AccessControlInformation } from './types';

export const loadAccessControl = (accessControl: AccessControlService) => (
  entityId: string
) => async (dispatch: ThunkDispatch<{}, {}, AnyAction>) => {
  const promises: [Promise<boolean>, Promise<boolean>, Promise<object | undefined>] = [
    accessControl.canRead(entityId),
    accessControl.canWrite(entityId),
    accessControl.getAccessControlInformation(entityId)
  ];

  const [readable, writable, information] = await Promise.all(promises);

  const action: LoadAccessControlSuccess = {
    type: LOAD_ACCESS_CONTROL_SUCCESS,
    payload: {
      hash: entityId,
      accessControl: {
        readable,
        writable,
        information
      }
    }
  };

  return dispatch(action);
};

export const LOAD_ACCESS_CONTROL_SUCCESS = 'LOAD_ACCESS_CONTROL_SUCCESS';

export interface LoadAccessControlSuccess {
  type: typeof LOAD_ACCESS_CONTROL_SUCCESS;
  payload: {
    hash: string;
    accessControl: AccessControlInformation<any>;
  };
}

export type AccessControlAction = LoadAccessControlSuccess;
