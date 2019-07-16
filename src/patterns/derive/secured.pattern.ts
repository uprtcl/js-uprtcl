import { Hashed, hashedPattern } from './hashed.pattern';
import { Signed, signedPattern } from './signed.pattern';
import { DerivePattern } from './derive.pattern';
import { ValidateProperties } from '../validate.pattern';
import { Properties } from '../pattern';

export type Secured<T = any> = Hashed<Signed<T>>;

export type SecuredPattern = DerivePattern<Secured, ValidateProperties>;

export const securedPattern: SecuredPattern = {
  recognize: (object: object) =>
    hashedPattern.recognize(object) && signedPattern.recognize(object['object']),

  properties(object: Secured, properties: Properties): ValidateProperties {
    return {
      validate: () =>
        hashedPattern.properties(object, properties).validate() &&
        signedPattern.properties(object.object, properties).validate()
    };
  },

  derive<T>(object: T): Secured<T> {
    const signed: Signed<T> = signedPattern.derive<T>(object);
    const hashed = hashedPattern.derive<Signed<T>>(signed);

    return hashed;
  }
};
