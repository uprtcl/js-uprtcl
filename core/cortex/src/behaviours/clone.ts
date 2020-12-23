import { Behaviour } from '../types/behaviour';

export interface Clone<T> extends Behaviour<T> {
  clone: (pattern: T) => Promise<string>;
}
