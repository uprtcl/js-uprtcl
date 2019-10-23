import { Hashed } from './hashable';

export interface Creatable<A, O> {
  create: (args: A, providerName?: string) => Promise<Hashed<O>>;
}
