import { ReduxModule } from '@uprtcl/micro-orchestrator';
import { objectsReducer, ObjectsState } from './objects.reducer';
import { ObjectActions } from './objects.actions';
import { reducerName } from './objects.selectors';
import { loadObject } from './objects.actions';
import { selectObjects, selectAll, selectById, selectByPattern } from './objects.selectors';

export function objectsReduxModule(): ReduxModule<ObjectsState, ObjectActions> {
  return new ReduxModule(reducerName, objectsReducer);
}

export { objectsReducer, ObjectsState, ObjectActions, loadObject };
export { selectObjects, selectAll, selectById, selectByPattern };
