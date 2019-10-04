import { Hashed, HashedPattern } from '../patterns/hashed.pattern';
import { Signed, SignedPattern } from '../patterns/signed.pattern';
import { Pattern } from '../pattern';
import { SecuredPattern } from '../patterns/secured.pattern';
import { injectable, inject } from 'inversify';
import { PatternTypes } from '../types';

export type Secured<T = any> = Hashed<Signed<T>>;

@injectable()
export class DefaultSecuredPattern implements Pattern, SecuredPattern<Secured<any>> {
  constructor(
    @inject(PatternTypes.Hashed) protected hashedPattern: Pattern & HashedPattern<any>,
    @inject(PatternTypes.Signed) protected signedPattern: Pattern & SignedPattern<any>
  ) {}

  recognize(object: object) {
    return (
      this.hashedPattern.recognize(object) &&
      this.signedPattern.recognize((object as Hashed<any>).object)
    );
  }

  validate<T>(object: Secured<T>): boolean {
    return this.hashedPattern.validate(object) && this.signedPattern.validate(object.object);
  }

  derive<T extends object>(object: T): Secured<T> {
    const signed: Signed<T> = this.signedPattern.derive(object);
    const hashed = this.hashedPattern.derive(signed);

    return hashed;
  }

  extract<T extends object>(secured: Secured<T>): T {
    return secured.object.payload;
  }
}
