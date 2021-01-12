import { Behaviour } from '../types/behaviour';

export interface HasTitle<T = any> extends Behaviour<T> {
  title: (pattern: T) => string;
}
