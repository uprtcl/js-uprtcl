import { inject, injectable } from 'inversify';
import {
  Pattern,
  PatternTypes,
  SecuredPattern,
  Secured,
  CreatePattern,
  Signed
} from '@uprtcl/cortex';
import { Context, Commit, UprtclTypes } from '../types';
import { UprtclProvider } from '../services/uprtcl/uprtcl.provider';

export const propertyOrder = ['creatorId', 'timestamp', 'nonce'];

@injectable()
export class ContextPattern
  implements Pattern, CreatePattern<{ timestamp: number; nonce: number }, Signed<Context>> {
  constructor(
    @inject(PatternTypes.Secured)
    protected securedPattern: Pattern & SecuredPattern<any>,
    @inject(UprtclTypes.UprtclProvider) protected uprtcl: UprtclProvider
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
    return this.uprtcl.createContext(args.timestamp, args.nonce);
  };
}
