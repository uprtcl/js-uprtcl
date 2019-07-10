import { HashedEntity } from './hashed.entity';
import { Signed, Proof, Secured } from '../types';

export class SecuredEntity<T> extends HashedEntity<Signed<T>> {
  setupObject(object: any): Secured<T> {
    const signed: Signed<T> = {
      payload: object,
      proof: {
        signature: this.sign(object)
      }
    };

    return super.setupObject(signed);
  }

  sign<O>(object: any): string {
    return '';
  }

  createProof(): Proof {
    return { signature: '' };
  }

  validateProof(): boolean {
    return true;
  }

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
