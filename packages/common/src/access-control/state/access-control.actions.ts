export const LOAD_ACCESS_CONTROL = '[ACCESS-CONTROL] LOAD_ACCESS_CONTROL';
export const LOAD_ACCESS_CONTROL_SUCCESS = '[ACCESS-CONTROL] LOAD_ACCESS_CONTROL_SUCCESS';

export interface LoadAccessControl {
  type: typeof LOAD_ACCESS_CONTROL;
  payload: {
    hash: string;
    entity: any;
  };
}
export interface LoadAccessControlSuccess {
  type: typeof LOAD_ACCESS_CONTROL_SUCCESS;
  payload: {
    hash: string;
    accessControl: any;
  };
}

export type AccessControlAction = LoadAccessControl | LoadAccessControlSuccess;
