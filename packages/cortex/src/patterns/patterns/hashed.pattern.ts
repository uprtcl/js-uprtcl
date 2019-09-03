import { DerivePattern } from './derive.pattern';
import { ValidatePattern } from './validate.pattern';

export interface Hashed<T extends object = object> {
  // Hash
  id: string;
  object: T;
}

export interface HashedPattern<T extends object>
  extends DerivePattern<Hashed<T>>,
    ValidatePattern<Hashed<T>> {
  // TODO return config
  getCidConfig(hash: string): any;
}
