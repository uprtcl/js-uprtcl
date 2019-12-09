import { Saga } from '@redux-saga/core';
import { getContext, call, put, takeEvery, retry } from '@redux-saga/core/effects';

import { DiscoveryTypes, Source, PatternRecognizer, PatternTypes, Pattern } from '@uprtcl/cortex';
import { ReduxTypes } from '@uprtcl/micro-orchestrator';
import {
  LOAD_ACCESS_CONTROL,
  LoadAccessControl,
  LoadAccessControlSuccess,
  LOAD_ACCESS_CONTROL_SUCCESS
} from './access-control.actions';
import { LOAD_ENTITY_SUCCESS, LoadEntitySuccess } from '../../entities';
import { Updatable } from '../properties/updatable';
import { AccessControlService } from '../services/access-control.service';

function* loadAccessControl(action: LoadAccessControl) {
  const recognizer: PatternRecognizer = (yield getContext(ReduxTypes.Context)).get(
    PatternTypes.Recognizer
  );

  const updatable: Updatable<any, any> | undefined = recognizer.recognizeUniqueProperty(
    action.payload.entity,
    prop => !!(prop as Updatable<any, any>).update
  );

  if (updatable) {
    const accessControlService: AccessControlService<any> | undefined = updatable.accessControl(
      action.payload.entity
    );

    if (accessControlService) {
      const accessControlInformation: any | undefined = yield retry(4, 3000, () =>
        accessControlService.getAccessControlInformation(action.payload.hash)
      );

      const accessControlSuccess: LoadAccessControlSuccess = {
        type: LOAD_ACCESS_CONTROL_SUCCESS,
        payload: {
          hash: action.payload.hash,
          accessControl: accessControlInformation
        }
      };
      yield put(accessControlSuccess);
    }
  }
}

export const loadAccessControlSaga: Saga = function*() {
  yield takeEvery(LOAD_ACCESS_CONTROL, loadAccessControl);
};

function* filterUpdatableEntity(action: LoadEntitySuccess) {
  const recognizer: PatternRecognizer = (yield getContext(ReduxTypes.Context)).get(
    PatternTypes.Recognizer
  );

  const updatable: Updatable<any, any> | undefined = recognizer.recognizeUniqueProperty(
    action.payload.entity,
    prop => !!(prop as Updatable<any, any>).update
  );

  if (updatable) {
    const accessControlAction: LoadAccessControl = {
      type: LOAD_ACCESS_CONTROL,
      payload: action.payload
    };
    yield put(accessControlAction);
  }
}

export const loadAccessControlOnEntityLoadSaga: Saga = function*() {
  yield takeEvery(LOAD_ENTITY_SUCCESS, filterUpdatableEntity);
};
