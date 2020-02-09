import { Hashed } from './hashable';

export interface Newable<A, T> {
  new: () => (args: A) => Promise<Hashed<T>>;
}
