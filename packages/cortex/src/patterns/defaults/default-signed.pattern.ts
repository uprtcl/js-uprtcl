import { SignedPattern, Signed } from '../patterns/signed.pattern';
import { injectable } from 'inversify';
import { Pattern } from '../pattern';

@injectable()
export class DefaultSignedPattern implements Pattern, SignedPattern<any> {
  recognize(object: object) {
    return object.hasOwnProperty('proof') && object.hasOwnProperty('payload');
  }

  validate<T>(signed: Signed<T>): boolean {
    return this.verifySignature(signed);
  }

  derive<T>(object: T): Signed<T> {
    return this.sign(object);
  }

  extract<T extends object>(signed: Signed<T>): T {
    return signed.payload;
  }

  sign<T>(object: T): Signed<T> {
    return {
      proof: {
        signature: '',
        type: 'ecdsa'
      },
      payload: object
    };
  }

  verifySignature<T>(signed: Signed<T>): boolean {
    return true;
  }
}
