import { Saga } from '@redux-saga/core';
import { injectable } from 'inversify';

import { ReduxModule } from '@uprtcl/micro-orchestrator';

import { EveesActions } from './evees.actions';
import { eveesReducerName } from './evees.selectors';
import { eveesReducer } from './evees.reducer';
import { loadPerspectiveDetailsSaga, loadDetailsOnPerspectiveLoadSaga } from './evees.sagas';

@injectable()
export class EveesReduxModule extends ReduxModule<any, EveesActions> {
  reducersMap = { [eveesReducerName]: eveesReducer };

  sagas: Saga[] = [loadPerspectiveDetailsSaga, loadDetailsOnPerspectiveLoadSaga];
}
