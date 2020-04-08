import { Behaviour } from '../types/behaviour';

export interface Cloneable<T> extends Behaviour<T> {
  clone: (pattern: any) => Promise<string>;
}
