import { Behaviour } from '../types/behaviour';

export interface HasContent<T = any> extends Behaviour<T> {
  content: (pattern: T) => Promise<any>;
}
