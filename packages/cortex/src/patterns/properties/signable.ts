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

export interface Signable<T = any> extends Derivable<Signed<T>>, IsValid<Signed<T>> {
  sign: () => (object: T) => Signed<T>;
  verifySignature: (pattern: Signed<T>) => boolean;
}
