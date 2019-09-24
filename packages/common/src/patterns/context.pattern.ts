import { Pattern, SecuredPattern, Secured, CreatePattern, Signed } from '@uprtcl/cortex';
import { Context } from '../types';
import { UprtclProvider } from '../services/uprtcl/uprtcl.provider';

export const propertyOrder = ['creatorId', 'timestamp', 'nonce'];

export class ContextPattern
  implements Pattern, CreatePattern<{ timestamp: number; nonce: number }, Signed<Context>> {
  constructor(
    protected securedPattern: Pattern & SecuredPattern<Secured<Context>>,
    protected uprtclProvider: UprtclProvider
  ) {}

  recognize(object: Object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Context>).hasOwnProperty(p)
      )
    );
  }

  create: (args: { timestamp: number; nonce: number }) => Promise<Secured<Context>> = (args: {
    timestamp: number;
    nonce: number;
  }): Promise<Secured<Context>> => {
    return this.uprtclProvider.createContext(args.timestamp, args.nonce);
  };
}
