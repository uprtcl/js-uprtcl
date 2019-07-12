import { Entity } from '../entity';

export class DerivedEntity<T extends object, O extends object> extends Entity<T> {
  derive(object: O): void {
    this.object = this.deriveObject(object);
  }

  deriveObject(object: O): T {
    throw new Error('Method not implemented');
  }
}
