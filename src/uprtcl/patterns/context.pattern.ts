import { Pattern, Properties } from '../../patterns/pattern';
import { Context } from '../types';
import { Secured } from '../../patterns/derive/secured.pattern';

export const propertyOrder = ['creatorId', 'timestamp', 'nonce'];

export interface ContextProperties extends Properties {}

export const contextPattern: Pattern<Secured<Context>, ContextProperties> = {
  recognize: (object: Object) => propertyOrder.every(p => object.hasOwnProperty(p)),
  properties(context: Secured<Context>) {
    return {};
  }
};
