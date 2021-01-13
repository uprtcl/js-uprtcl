import { Behaviour } from '../interfaces/behaviour';

export interface HasTitle<T = any> extends Behaviour<T> {
  title: (pattern: T) => string;
}
