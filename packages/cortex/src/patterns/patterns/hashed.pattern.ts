import { DerivePattern } from './derive.pattern';
import { ValidatePattern } from './validate.pattern';
import { CidConfig } from '../../utils/cid.config';

export interface Hashed<T extends object = object> {
  // Hash
  id: string;
  object: T;
}

export interface HashedPattern<T extends object>
  extends DerivePattern<Hashed<T>>,
    ValidatePattern<Hashed<T>> {
  getCidConfig(hash: string): CidConfig;
}
