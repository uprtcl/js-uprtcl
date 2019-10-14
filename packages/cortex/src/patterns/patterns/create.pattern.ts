import { Hashed } from './hashed.pattern';

export interface CreatePattern<A, O> {
  create: (args: A, providerName?: string) => Promise<Hashed<O>>;
}
