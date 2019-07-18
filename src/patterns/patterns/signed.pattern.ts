import { ValidatePattern } from './validate.pattern';
import { DerivePattern } from './derive.pattern';

export interface Proof {
  signature: string;
}

export interface Signed<T = any> {
  object: T;
  proof: Proof;
}

export interface SignedPattern<T> extends DerivePattern<Signed<T>>, ValidatePattern<Signed<T>> {
  sign(object: T): Signed<T>;
  verifySignature(signed: Signed<T>): boolean;
}
