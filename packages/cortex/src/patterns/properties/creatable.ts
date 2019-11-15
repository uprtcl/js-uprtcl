import { Hashed } from './hashable';

export interface Creatable<A, O> {
  create: (args: A | undefined, upl?: string) => Promise<Hashed<O>>;
}
