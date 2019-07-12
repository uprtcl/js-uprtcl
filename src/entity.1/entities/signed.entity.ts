import { Entity } from '../entity';
import { Signed } from '../../types';
import { DerivedEntity } from './derived.entity';

export class SignedEntity<T extends Object> extends DerivedEntity<Signed<T>, T> {
  deriveObject<T>(object: T): Signed<T> {
    return {
      payload: object,
      proof: {
        signature: this.sign(object)
      }
    };
  }

  sign(object: any): string {
    return '';
  }
}
