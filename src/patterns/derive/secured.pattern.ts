import { Hashed, HashedPattern } from './hashed.pattern';
import { Signed, SignedPattern } from './signed.pattern';
import { DerivePattern } from './derive.pattern';
import { ValidatePattern } from '../validate.pattern';

export type Secured<T = any> = Hashed<Signed<T>>;

export class SecuredPattern implements DerivePattern<Secured>, ValidatePattern<Secured> {
  constructor(protected hashedPattern: HashedPattern, protected signedPattern: SignedPattern) {}

  recognize(object: object) {
    return this.hashedPattern.recognize(object) && this.signedPattern.recognize(object['object']);
  }

  validate<T>(secured: Secured<T>): boolean {
    return this.hashedPattern.validate(secured) && this.signedPattern.validate(secured.object);
  }

  derive<T>(object: T): Secured<T> {
    const signed: Signed<T> = this.signedPattern.derive<T>(object);
    const hashed = this.hashedPattern.derive<Signed<T>>(signed);

    return hashed;
  }
}
