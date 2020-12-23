import { Behaviour } from '../types/behaviour';

export interface New<A, T> extends Behaviour<T> {
  new: () => (args: A) => Promise<T>;
}
