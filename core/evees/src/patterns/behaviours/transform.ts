import { Behaviour } from '../types/behaviour';

export interface Transform<R extends Array<any>, T = any> extends Behaviour<T> {
  transform: (pattern: T) => R;
}
