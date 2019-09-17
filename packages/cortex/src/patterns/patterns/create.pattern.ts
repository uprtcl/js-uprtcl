import { Hashed } from './hashed.pattern';

export interface EntityDetails {
  icon: string;
  name: string;
}

export interface CreatePattern<A extends Array<any>, O extends object> {
  create: (...args: A) => Promise<Hashed<O>>;
}
