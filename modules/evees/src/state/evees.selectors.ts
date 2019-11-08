import { EveesState } from './evees.reducer';

export const eveesReducerName = 'evees-state';

export const selectEvees = (state: any): EveesState => state[eveesReducerName];

export const selectPerspectiveDetails = (perspectiveId: string) => (state: EveesState) =>
  state.details[perspectiveId];

export const selectPerspectiveHeadId = (perspectiveId: string) => (state: EveesState) =>
  state.details[perspectiveId] && state.details[perspectiveId].headId;
