import { Hashed } from './hashable';
import { Property } from '../pattern';

export interface Creatable<A, O> extends Property<Hashed<O>> {
  create: () => (args: A | undefined, upl?: string) => Promise<Hashed<O>>;
}
