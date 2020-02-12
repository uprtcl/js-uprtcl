import { Property } from '../pattern';
import { Hashed } from './hashable';

export interface Creatable<A, O> extends Property<any> {
  create: () => (args: A, source: string) => Promise<Hashed<O>>;
}
