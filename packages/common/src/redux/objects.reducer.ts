import { Dictionary } from 'lodash';
import { ObjectActions, LOAD_OBJECT_SUCCESS } from './objects.actions';

export interface ObjectsState {
  objects: Dictionary<object>;
}

export const initialState: ObjectsState = {
  objects: {}
};

export function objectsReducer(state = initialState, action: ObjectActions): ObjectsState {
  switch (action.type) {
    case LOAD_OBJECT_SUCCESS: {
      return {
        ...state.objects,
        [action.payload.hash]: action.payload.object
      };
    }

    default: {
      return state;
    }
  }
}
