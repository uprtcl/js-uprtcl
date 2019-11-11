import { PerspectiveDetails } from '../types';

export const LOAD_PERSPECTIVE_DETAILS = '[EVEES] LOAD_PERSPECTIVE_DETAILS';
export const LOAD_PERSPECTIVE_DETAILS_SUCCESS = '[EVEES] LOAD_PERSPECTIVE_DETAILS_SUCCESS';

export interface LoadPerspectiveDetails {
  type: typeof LOAD_PERSPECTIVE_DETAILS;
  payload: {
    perspectiveId: string;
  };
}
export interface LoadPerspectiveDetailsSuccess {
  type: typeof LOAD_PERSPECTIVE_DETAILS_SUCCESS;
  payload: {
    perspectiveId: string;
    details: PerspectiveDetails;
  };
}

export type EveesActions = LoadPerspectiveDetails | LoadPerspectiveDetailsSuccess;
