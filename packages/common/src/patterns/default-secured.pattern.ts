import { injectable, inject } from 'inversify';

import {
  Hashed,
  Hashable,
  Signed,
  Signable,
  IsSecure,
  PatternTypes,
  Pattern
} from '@uprtcl/cortex';

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

  validate = <T>(object: Secured<T>): Promise<boolean> => {
    return this.hashedPattern.validate(object) && this.signedPattern.validate(object.object);
  };

  derive = () => async <T extends object>(object: T): Promise<Secured<T>> => {
    const signed: Signed<T> = await this.signedPattern.derive()(object);
    const hashed = await this.hashedPattern.derive()(signed);

    return hashed;
  };

  extract<T extends object>(secured: Secured<T>): T {
    return secured.object.payload;
  }
}
