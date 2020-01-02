import { Derivable } from './derivable';
import { IsValid } from './is-valid';

export interface Hashed<T> {
  // Hash
  id: string;
  object: T;
}

export interface Hashable<T extends object> extends Derivable<Hashed<T>>, IsValid {}
