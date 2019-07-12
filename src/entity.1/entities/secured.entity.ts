import { HashedEntity } from './hashed.entity';
import { Signed, Proof, Secured, Hashed } from '../../types';
import { Entity } from '../entity';
import { DerivedEntity } from './derived.entity';

export class SecuredEntity<T extends object> extends DerivedEntity<Secured<T>, T> {
  deriveObject(object: T): Secured<T> {}

  /**
   * Asserts validation of hash and proof of the given object
   * Otherwise throw an error
   */
  validate(): void {
    if (!this.validateProof()) {
      throw new Error(
        `Invalid proof ${this.object.object.proof} for the given object ${this.object.object.payload}`
      );
    }

    if (!this.validateHash()) {
      throw new Error(`Invalid hash ${this.object.id} for the given object ${this.object.object}`);
    }
  }
}
