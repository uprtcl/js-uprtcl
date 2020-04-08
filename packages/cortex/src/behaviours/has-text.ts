import { Behaviour } from '../types/behaviour';

export interface HasText<T = any> extends Behaviour<T> {
  text: (pattern: T) => string;
}
