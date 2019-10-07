import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { Source } from '../services/sources/source';

export const loadEntity = (source: Source) => (hash: string) => async (
  dispatch: ThunkDispatch<{}, {}, AnyAction>
) => {
  const object = await source.get(hash);

  console.log('object', object, source);
  if (object) {
    dispatch(loadEntitySuccess(hash, object));
  }

  return object;
};

export const LOAD_ENTITY_SUCCESS = 'LOAD_ENTITY_SUCCESS';

export interface LoadEntitySuccess {
  type: typeof LOAD_ENTITY_SUCCESS;
  payload: {
    hash: string;
    entity: object;
  };
}

export function loadEntitySuccess(hash: string, entity: object): LoadEntitySuccess {
  return { type: LOAD_ENTITY_SUCCESS, payload: { hash, entity } };
}

export type EntityActions = LoadEntitySuccess;
