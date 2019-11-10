import { Dictionary } from 'lodash';
import { EveesActions, LOAD_PERSPECTIVE_DETAILS_SUCCESS } from './evees.actions';
import { PerspectiveDetails } from '../types';

export interface EveesState {
  details: Dictionary<PerspectiveDetails>;
}

export const initialState: EveesState = {
  details: {}
};

export function eveesReducer(
  state = initialState,
  action: EveesActions
): EveesState {
  switch (action.type) {
    case LOAD_PERSPECTIVE_DETAILS_SUCCESS: {
      return {
        ...state,
        details: {
          ...state.details,
          [action.payload.perspectiveId]: action.payload.details
        }
      };
    }

    default: {
      return state;
    }
  }
}
