import { Pattern, SecuredPattern, Secured } from '@uprtcl/cortex';
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
