import { Behaviour } from '../types/behaviour';

export interface HasType<Type, T = any> extends Behaviour<T> {
  type: (pattern: T) => Type;
}
