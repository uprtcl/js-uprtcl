import { ValidatePattern } from '../validate.pattern';
import { DerivePattern } from './derive.pattern';

export interface Proof {
  signature: string;
}

export interface Signed<T = any> {
  object: T;
  proof: Proof;
}

export class SignedPattern implements DerivePattern<Signed>, ValidatePattern<Signed> {
  recognize(object: object) {
    return object.hasOwnProperty('proof') && object.hasOwnProperty('object');
  }

  validate<T>(signed: Signed<T>): boolean {
    return true;
  }

  derive<T>(object: T): Signed<T> {
    return {
      proof: {
        signature: ''
      },
      object: object
    };
  }
}
