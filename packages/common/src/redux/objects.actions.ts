import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { Source } from '../../../core/src/services';

export const loadObject = (source: Source) => (hash: string) => async (
  dispatch: ThunkDispatch<{}, {}, AnyAction>
) => {
  const object = await source.get(hash);
  dispatch(loadObjectSuccess(hash, object));
  return object;
};

export const LOAD_OBJECT_SUCCESS = 'LOAD_OBJECT_SUCCESS';

export interface LoadObjectSuccess {
  type: typeof LOAD_OBJECT_SUCCESS;
  payload: {
    hash: string;
    object: object;
  };
}

export function loadObjectSuccess(hash: string, object: object): LoadObjectSuccess {
  return { type: LOAD_OBJECT_SUCCESS, payload: { hash, object } };
}

export type ObjectActions = LoadObjectSuccess;
