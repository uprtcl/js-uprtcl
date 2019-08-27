import { ReduxModule } from '@uprtcl/micro-orchestrator';
import { EntitiesState, entitiesReducer } from './entities.reducer';
import { EntityActions } from './entities.actions';
import { entitiesReducerName } from './entities.selectors';
export { entitiesReducer, EntitiesState } from './entities.reducer';
export { EntityActions } from './entities.actions';
export { loadEntity } from './entities.actions';
export { selectEntities, selectAll, selectById, selectByPattern } from './entities.selectors';
export { entitiesReducerName };

export function entitiesReduxModule(): ReduxModule<EntitiesState, EntityActions> {
  return new ReduxModule(entitiesReducerName, entitiesReducer);
}
