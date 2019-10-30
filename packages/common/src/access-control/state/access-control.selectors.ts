import { AccessControlState } from './access-control.reducer';

export const accessControlReducerName = 'access-control';

export const selectAccessControl = (state: any): AccessControlState =>
  state[accessControlReducerName];

export const selectEntityAccessControl = (id: string) => (state: AccessControlState) =>
  state.accessControl[id];
