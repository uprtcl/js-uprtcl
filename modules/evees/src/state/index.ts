import { reduxModule, MicroModule } from '@uprtcl/micro-orchestrator';
import { EveesActions } from './evees.actions';
import { eveesReducerName } from './evees.selectors';
import { eveesReducer } from './evees.reducer';
import { loadPerspectiveDetailsSaga, loadDetailsOnPerspectiveLoadSaga } from './evees.sagas';

export function eveesReduxModule(): MicroModule {
  return reduxModule<any, EveesActions>({ [eveesReducerName]: eveesReducer }, [
    loadPerspectiveDetailsSaga,
    loadDetailsOnPerspectiveLoadSaga
  ]);
}
