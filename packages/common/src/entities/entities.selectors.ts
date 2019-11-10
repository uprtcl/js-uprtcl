import { Pattern } from '@uprtcl/cortex';

import { EntitiesState } from './entities.reducer';

export const entitiesReducerName = 'entities-reducer';

export const selectEntities = (state: any): EntitiesState => state[entitiesReducerName];

export const selectAll = (state: EntitiesState) => {
  const entities = state.entities;
  return Object.keys(entities).map(key => entities[key]);
};

export const selectById = (id: string) => (state: EntitiesState) => state.entities[id];

export const selectByPattern = (pattern: Pattern) => (state: EntitiesState) => {
  return selectAll(state).filter(object => pattern.recognize(object));
};
