import { DerivePattern } from './derive.pattern';
import { ValidatePattern } from '../validate.pattern';
import { CidConfig } from '../../utils/cid.config';

export interface Hashed<T = any> {
  // Hash
  id: string;
  object: T;
}

export class HashedPattern implements DerivePattern<Hashed>, ValidatePattern<Hashed> {
  recognize(object: object) {
    return (
      object.hasOwnProperty('id') && typeof object['id'] === 'string' && object['id'].length > 200
    );
  }

  validate<T>(object: Hashed<T>): boolean {
    return true;
  }

  derive<T>(object: T): Hashed<T> {
    return {
      id: 'getHash()',
      object: object
    };
  }

  getCidConfig(hash: string): CidConfig {
    return CidConfig.fromCid(hash);
  }
}
