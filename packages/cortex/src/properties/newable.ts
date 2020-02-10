import { Hashed } from './hashable';

export interface Newable<A, T> {
  new: () => (args: A, recipe: any) => Promise<Hashed<T>>;
}
