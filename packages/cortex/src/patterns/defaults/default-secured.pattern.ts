import { Hashed, Hashable } from '../properties/hashable';
import { Signed, Signable } from '../properties/signable';
import { Pattern } from '../pattern';
import { IsSecure } from '../properties/is-secure';
import { injectable, inject } from 'inversify';
import { PatternTypes } from '../../types';

export type Secured<T = any> = Hashed<Signed<T>>;

@injectable()
export class DefaultSecuredPattern implements Pattern, IsSecure<Secured<any>> {
  constructor(
    @inject(PatternTypes.Core.Hashed) protected hashedPattern: Pattern & Hashable<any>,
    @inject(PatternTypes.Core.Signed) protected signedPattern: Pattern & Signable<any>
  ) {}

  recognize(object: object) {
    return (
      this.hashedPattern.recognize(object) &&
      this.signedPattern.recognize((object as Hashed<any>).object)
    );
  }

  validate<T>(object: Secured<T>): Promise<boolean> {
    return this.hashedPattern.validate(object) && this.signedPattern.validate(object.object);
  }

  async derive<T extends object>(object: T): Promise<Secured<T>> {
    const signed: Signed<T> = await this.signedPattern.derive(object);
    const hashed = await this.hashedPattern.derive(signed);

    return hashed;
  }

  extract<T extends object>(secured: Secured<T>): T {
    return secured.object.payload;
  }
}
