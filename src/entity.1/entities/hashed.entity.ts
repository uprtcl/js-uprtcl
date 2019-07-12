import { Hashed } from '../../types';
import { DerivedEntity } from './derived.entity';

export class HashedEntity<T extends object> extends DerivedEntity<Hashed<T>, T> {
  deriveObject<T>(object: T): Hashed<T> {
    return {
      id: this.hash(object),
      object: object
    };
  }

  hash(object: any): string {
    return '';
  }

  public validateHash(): boolean {
    return true;
  }
}
