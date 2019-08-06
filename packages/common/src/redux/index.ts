import { ReduxModule } from '../../../micro-orchestrator/src/modules/redux/redux.module';
import { objectsReducer, ObjectsState } from './objects.reducer';
import { ObjectActions } from './objects.actions';
import { reducerName } from './objects.selectors';

export function objectsReduxModule(): ReduxModule<ObjectsState, ObjectActions> {
  return new ReduxModule(reducerName, objectsReducer);
}

export { objectsReducer, ObjectsState, ObjectActions };
