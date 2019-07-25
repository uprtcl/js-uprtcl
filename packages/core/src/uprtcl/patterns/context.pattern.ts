import { Pattern } from '../../patterns/pattern';
import { SecuredPattern } from '../../patterns/patterns/secured.pattern';
import { Secured } from '../../patterns/defaults/default-secured.pattern';
import { Context } from '../types';

export const propertyOrder = ['creatorId', 'timestamp', 'nonce'];

export class ContextPattern implements Pattern {
  constructor(protected securedPattern: Pattern & SecuredPattern<Secured<Context>>) {}

  recognize(object: Object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Context>).hasOwnProperty(p)
      )
    );
  }
}
