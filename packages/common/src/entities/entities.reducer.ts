import { Dictionary } from 'lodash';
import { EntityActions, LOAD_ENTITY_SUCCESS } from './entities.actions';

export interface EntitiesState {
  entities: Dictionary<object>;
}

export const initialState: EntitiesState = {
  entities: {}
};

export function entitiesReducer(state = initialState, action: EntityActions): EntitiesState {
  switch (action.type) {
    case LOAD_ENTITY_SUCCESS: {
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.payload.hash]: action.payload.entity
        }
      };
    }

    default: {
      return state;
    }
  }
}
