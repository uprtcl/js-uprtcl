import { getContext, put, call, takeEvery } from '@redux-saga/core/effects';
import { Saga } from '@redux-saga/core';

import { LoadEntitySuccess, LOAD_ENTITY_SUCCESS } from '@uprtcl/common';
import { ReduxTypes } from '@uprtcl/micro-orchestrator';

import {
  LoadPerspectiveDetails,
  LOAD_PERSPECTIVE_DETAILS,
  LoadPerspectiveDetailsSuccess,
  LOAD_PERSPECTIVE_DETAILS_SUCCESS
} from './evees.actions';
import { UprtclTypes } from '../types';
import { PerspectivePattern } from '../patterns/perspective.pattern';
import { Uprtcl } from '../services/uprtcl';

function* loadPerspectiveDetails(action: LoadPerspectiveDetails) {
  const uprtcl: Uprtcl = (yield getContext(ReduxTypes.Context)).get(UprtclTypes.Uprtcl);
  const details = yield call(() => uprtcl.getPerspectiveDetails(action.payload.perspectiveId));

  const successAction: LoadPerspectiveDetailsSuccess = {
    type: LOAD_PERSPECTIVE_DETAILS_SUCCESS,
    payload: {
      perspectiveId: action.payload.perspectiveId,
      details
    }
  };
  yield put(successAction);
}

export const loadPerspectiveDetailsSaga: Saga = function*() {
  yield takeEvery(LOAD_PERSPECTIVE_DETAILS, loadPerspectiveDetails);
};

function* filterPerspectiveEntity(action: LoadEntitySuccess) {
  const perspectivePattern: PerspectivePattern = (yield getContext(ReduxTypes.Context)).get(
    UprtclTypes.PerspectivePattern
  );

  if (perspectivePattern.recognize(action.payload.entity)) {
    const loadPerspectiveDetailsAction: LoadPerspectiveDetails = {
      type: LOAD_PERSPECTIVE_DETAILS,
      payload: { perspectiveId: action.payload.hash }
    };
    yield put(loadPerspectiveDetailsAction);
  }
}

export const loadDetailsOnPerspectiveLoadSaga: Saga = function*() {
  yield takeEvery(LOAD_ENTITY_SUCCESS, filterPerspectiveEntity);
};
