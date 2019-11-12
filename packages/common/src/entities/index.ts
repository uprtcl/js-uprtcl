import { Saga } from '@redux-saga/core';

import { ReduxModule } from '@uprtcl/micro-orchestrator';

import { entitiesReducer } from './entities.reducer';
import { loadEntitySaga } from './entities.sagas';
import { entitiesReducerName } from './entities.selectors';
import { EntityActions } from './entities.actions';
import { injectable } from 'inversify';

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

@injectable()
export class EntitiesReduxModule extends ReduxModule<any, EntityActions> {
  reducersMap = { [entitiesReducerName]: entitiesReducer };

  sagas: Saga[] = [loadEntitySaga];
}
