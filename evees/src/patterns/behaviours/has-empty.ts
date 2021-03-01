import { Behaviour } from '../interfaces/behaviour';

export interface HasEmpty<T = any> extends Behaviour<T> {
  empty: () => T;
}
