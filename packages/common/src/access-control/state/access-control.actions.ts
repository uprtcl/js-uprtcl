import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { AccessControlService } from '../services/access-control.service';
import { AccessControlInformation } from './types';
import { PatternRecognizer, Pattern } from '@uprtcl/cortex';
import { Updatable } from '../properties/updatable';

export const loadAccessControl = (patternRecognizer: PatternRecognizer) => (
  entityId: string,
  entity: any
) => async (dispatch: ThunkDispatch<{}, {}, AnyAction>) => {
  const patterns: Pattern & Updatable = patternRecognizer.recognizeMerge(entity);

  if (!(patterns as Updatable).accessControl) return;

  const accessControl = (patterns as Updatable).accessControl(entity);

  if (!accessControl) return;

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
