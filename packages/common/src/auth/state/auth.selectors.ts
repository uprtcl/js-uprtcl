import { AuthState } from './auth.reducer';

export const authReducerName = 'auth-reducer';

export const selectAuth = (state: any): AuthState => state[authReducerName];

export const selectUplAuthInfo = (upl: string) => (state: AuthState) =>
  state.uplAuthsInfo[upl];
