import { Hashed, HashedPattern } from '../patterns/hashed.pattern';
import { Signed, SignedPattern } from '../patterns/signed.pattern';
import { Pattern } from '../pattern';
import { SecuredPattern } from '../patterns/secured.pattern';

export type Secured<T = any> = Hashed<Signed<T>>;

export class DefaultSecuredPattern implements SecuredPattern<Secured<any>> {
  constructor(
    protected hashedPattern: Pattern & HashedPattern<any>,
    protected signedPattern: Pattern & SignedPattern<any>
  ) {}

  recognize(object: object) {
    return this.hashedPattern.recognize(object) && this.signedPattern.recognize(object['object']);
  }

  validate<T>(object: Secured<T>): boolean {
    return this.hashedPattern.validate(object) && this.signedPattern.validate(object.object);
  }

  derive<T extends object>(object: T): Secured<T> {
    const signed: Signed<T> = this.signedPattern.derive(object);
    const hashed = this.hashedPattern.derive(signed);

    return hashed;
  }
}
