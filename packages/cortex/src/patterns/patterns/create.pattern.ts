import { Hashed } from './hashed.pattern';

export interface CreatePattern<A extends Array<any>, O extends object> {
  create: (...args: A) => Promise<Hashed<O>>;
}
