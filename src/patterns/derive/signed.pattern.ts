import { Properties } from '../pattern';
import { ValidateProperties } from '../validate.pattern';
import { DerivePattern } from './derive.pattern';

export interface Proof {
  signature: string;
}

export interface Signed<T = any> {
  object: T;
  proof: Proof;
}

export const signedPattern: DerivePattern<Signed, ValidateProperties> = {
  recognize: (object: object) => object.hasOwnProperty('proof') && object.hasOwnProperty('object'),

  properties(object: object, properties: Properties): ValidateProperties {
    return {
      validate: () => true
    };
  },

  derive<T>(object: T): Signed<T> {
    return {
      proof: {
        signature: ''
      },
      object: object
    };
  }
};
