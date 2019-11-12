import { Hashed } from './hashable';

export interface Creatable<A, O> {
  create: (args: A, upl?: string) => Promise<Hashed<O>>;
}
