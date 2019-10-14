import { inject, injectable } from 'inversify';
import {
  Pattern,
  PatternTypes,
  HashedPattern,
  CreatePattern,
  Hashed
} from '@uprtcl/cortex';
import { Context, UprtclTypes } from '../types';
import { UprtclProvider } from '../services/uprtcl.provider';
import { UprtclMultiplatform } from '../services/uprtcl.multiplatform';

export const propertyOrder = ['creatorId', 'timestamp', 'nonce'];

export type NewContextArgs = { timestamp: number; nonce: number } | { context: string };

@injectable()
export class ContextPattern implements Pattern {
  constructor(
    @inject(PatternTypes.Core.Hashed)
    protected hashedPattern: Pattern & HashedPattern<any>,
    @inject(UprtclTypes.UprtclMultiplatform) protected uprtclMultiplatform: UprtclMultiplatform
  ) {}

  recognize(object: object) {
    return (
      this.hashedPattern.recognize(object) && typeof (this.hashedPattern.extract(object as Hashed<string>)) === 'string'
    );
  }
}
