import { reduxModule, MicroModule } from '@uprtcl/micro-orchestrator';
import { entitiesReducer } from './entities.reducer';
import { EntityActions } from './entities.actions';
import { entitiesReducerName } from './entities.selectors';
export { entitiesReducer, EntitiesState } from './entities.reducer';
export { EntityActions } from './entities.actions';
export { loadEntity } from './entities.actions';
export { selectEntities, selectAll, selectById, selectByPattern } from './entities.selectors';
export { entitiesReducerName };

export function entitiesReduxModule(): MicroModule {
  return reduxModule<any, EntityActions>({ [entitiesReducerName]: entitiesReducer });
}
