import { ObjectsState } from './objects.reducer';
import PatternRegistry from '../../../core/src/patterns/registry/pattern.registry';
import { Pattern } from '../../../core/src/patterns/pattern';

export const reducerName = 'objects';

export const selectObjects = (state: any): ObjectsState => state[reducerName];

export const selectAll = (state: ObjectsState) => {
  const objects = state.objects;
  return Object.keys(objects).map(key => objects[key]);
};

export const selectById = (id: string) => (state: ObjectsState) => state.objects[id];

export const selectByPattern = (patternRegistry: PatternRegistry) => (patternName: string) => (
  state: ObjectsState
) => {
  const pattern: Pattern = patternRegistry.getPattern(patternName);

  return selectAll(state).filter(object => pattern.recognize(object));
};
