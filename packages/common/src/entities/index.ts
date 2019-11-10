import { reduxModule, MicroModule } from '@uprtcl/micro-orchestrator';

import { entitiesReducer } from './entities.reducer';
import { loadEntitySaga } from './entities.sagas';
import { entitiesReducerName } from './entities.selectors';
import { EntityActions } from './entities.actions';

export {
  LOAD_ENTITY,
  EntityActions,
  LOAD_ENTITY_SUCCESS,
  LoadEntity,
  LoadEntitySuccess
} from './entities.actions';
export { entitiesReducer, EntitiesState } from './entities.reducer';
export { selectEntities, selectAll, selectById, selectByPattern } from './entities.selectors';
export { entitiesReducerName };

export function entitiesReduxModule(): MicroModule {
  return reduxModule<any, EntityActions>({ [entitiesReducerName]: entitiesReducer }, [
    loadEntitySaga
  ]);
}
