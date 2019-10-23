import { IsValid } from './is-valid';
import { Derivable } from './derivable';

export interface Proof {
  signature: string;
  type: string;
}

export interface Signed<T = any> {
  payload: T;
  proof: Proof;
}

export interface Signable<T> extends Derivable<Signed<T>>, IsValid {
  sign(object: T): Signed<T>;
  verifySignature(signed: Signed<T>): boolean;
}
