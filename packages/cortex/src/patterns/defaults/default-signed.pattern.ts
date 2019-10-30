import { Signable, Signed } from '../properties/signable';
import { injectable } from 'inversify';
import { Pattern } from '../pattern';

@injectable()
export class DefaultSignedPattern implements Pattern, Signable<any> {
  recognize(object: object) {
    return object.hasOwnProperty('proof') && object.hasOwnProperty('payload');
  }

  async validate<T>(signed: Signed<T>): Promise<boolean> {
    return this.verifySignature(signed);
  }

  async derive<T>(object: T): Promise<Signed<T>> {
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
