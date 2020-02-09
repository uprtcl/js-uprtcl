import { injectable } from 'inversify';

import { Signable, Signed, Pattern } from '@uprtcl/cortex';

@injectable()
export class DefaultSignedPattern implements Pattern, Signable<any> {
  recognize(object: object) {
    return object.hasOwnProperty('proof') && object.hasOwnProperty('payload');
  }

  validate = async <T>(signed: Signed<T>): Promise<boolean> => this.verifySignature(signed);

  derive = () => async <T>(object: T): Promise<Signed<T>> => {
    return this.sign()(object);
  };

  extract<T extends object>(signed: Signed<T>): T {
    return signed.payload;
  }

  sign = () => <T>(object: T): Signed<T> => {
    return {
      proof: {
        signature: '',
        type: ''
      },
      payload: object
    };
  };

  verifySignature<T>(signed: Signed<T>): boolean {
    return true;
  }
}
