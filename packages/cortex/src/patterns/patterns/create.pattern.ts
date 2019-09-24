import { Hashed } from './hashed.pattern';

export interface EntityDetails {
  icon: string;
  name: string;
}

export interface CreatePattern<A extends object, O extends object> {
  create: (args: A) => Promise<Hashed<O>>;
}
