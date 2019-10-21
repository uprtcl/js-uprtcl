import { DerivePattern } from './derive.pattern';
import { ValidatePattern } from './validate.pattern';

export interface Hashed<T> {
  // Hash
  id: string;
  object: T;
}

export interface HashedPattern<T extends object>
  extends DerivePattern<Hashed<T>>,
    ValidatePattern<Hashed<T>> {}
