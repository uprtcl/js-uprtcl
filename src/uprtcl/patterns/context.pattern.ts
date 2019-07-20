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
    ClonePattern<Secured<Context>, UprtclProvider>,
    CreatePattern<Context, Secured<Context>, UprtclProvider> {
  recognize(object: Object) {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  clone(context: Secured<Context>, service: UprtclProvider): Promise<string> {
    return service.cloneContext(context);
  }

  create(context: Context, service: UprtclProvider): Promise<Secured<Context>> {
    return service.createContext(context);
  }
}
