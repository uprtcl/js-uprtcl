import { Saga } from '@redux-saga/core';
import { getContext, call, put, takeEvery } from '@redux-saga/core/effects';

import { DiscoveryTypes, Source } from '@uprtcl/cortex';
import { ReduxTypes } from '@uprtcl/micro-orchestrator';

import { LoadEntity, LOAD_ENTITY_SUCCESS, LOAD_ENTITY } from './entities.actions';

function* loadEntity(action: LoadEntity) {
  const context = yield getContext(ReduxTypes.Context);

  const discoveryService: Source = context.get(DiscoveryTypes.DiscoveryService);
  const entity = yield call(()=> discoveryService.get(action.payload.hash));

  if (entity) {
    yield put({ type: LOAD_ENTITY_SUCCESS, payload: { hash: action.payload.hash, entity } });
  }
}

export const loadEntitySaga: Saga = function*() {
  yield takeEvery(LOAD_ENTITY, loadEntity);
};
