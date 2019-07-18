import { Pattern } from '../../patterns/pattern';
import { Context, Perspective } from '../types';
import { Secured } from '../../patterns/defaults/default-secured.pattern';
import { ClonePattern } from '../../patterns/patterns/clone.pattern';
import { UprtclProvider } from '../services/uprtcl.provider';
import { CreatePattern } from '../../patterns/patterns/create.pattern';

export const propertyOrder = ['creatorId', 'timestamp', 'nonce'];

export class ContextPattern
  implements
    Pattern,
    ClonePattern<UprtclProvider, Secured<Context>>,
    CreatePattern<UprtclProvider, Context, Secured<Context>> {
  recognize(object: Object) {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  clone(service: UprtclProvider, context: Secured<Context>): Promise<string> {
    return service.cloneContext(context);
  }

  create(service: UprtclProvider, context: Context): Promise<Secured<Context>> {
    return service.createContext(context);
  }
}
