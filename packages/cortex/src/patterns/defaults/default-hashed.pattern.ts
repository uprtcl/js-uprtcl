import { injectable } from 'inversify';
import { HashedPattern, Hashed } from '../patterns/hashed.pattern';
import { TransformPattern } from '../patterns/transform.pattern';
import { Pattern } from '../pattern';

export function recognizeHashed(object: object) {
  return (
    object.hasOwnProperty('id') &&
    typeof object['id'] === 'string' &&
    object.hasOwnProperty('object')
  );
}

@injectable()
export class DefaultHashedPattern
  implements Pattern, HashedPattern<any>, TransformPattern<Hashed<any>, [any]> {
  recognize(object: object) {
    return recognizeHashed(object);
  }

  validate<T extends object>(object: Hashed<T>): boolean {
    return true;
  }

  async derive<T>(object: T): Promise<Hashed<T>> {
    const msgUint8 = new TextEncoder().encode(JSON.stringify(object)); // encode as (utf-8) Uint8Array
    const hash = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hash)); // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return {
      id: hashHex,
      object: object
    };
  }

  extract<T>(hashed: Hashed<T>): T {
    return hashed.object;
  }

  getCidConfig(hash: string): any {
    return null; // TODO fix this
  }

  transform(hashed: Hashed<any>): [any] {
    return [hashed.object];
  }
}
